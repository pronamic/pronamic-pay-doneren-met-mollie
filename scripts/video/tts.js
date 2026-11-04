/**
 * Generate the narration audio from `script.json`.
 *
 * One WAV file per step in `build/video/audio`, plus `durations.json` that
 * the recording uses to give every step enough time. A step is only
 * generated again when its text or the voice changes.
 *
 * Text-to-speech provider, `TTS_PROVIDER` or the first one available:
 *
 * - `chatterbox`: Chatterbox Multilingual, open source and local, needs `uv`.
 *   Optional `CHATTERBOX_VOICE`: a WAV file of about 10 seconds of Dutch
 *   speech, the voice to clone.
 * - `elevenlabs`: `ELEVENLABS_API_KEY`, optional `ELEVENLABS_VOICE_ID`.
 * - `openai`: `OPENAI_API_KEY`, optional `OPENAI_VOICE`.
 * - `say`: macOS with the Dutch voice Xander, robotic but free.
 *
 * Usage: `npm run video:tts`, no WordPress needed.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const crypto = require( 'crypto' );
const { spawnSync } = require( 'child_process' );
const { dirs, readScript, allSteps, mediaDuration, run } = require( './lib' );

// Changes when the audio processing changes, so all steps are generated again.
const format = 'wav-48k-mono-trimmed';

/**
 * Whether a command exists.
 *
 * @param {string} command Command.
 * @return {boolean} Exists.
 */
const hasCommand = ( command ) =>
	0 === spawnSync( 'which', [ command ], { stdio: 'ignore' } ).status;

const providers = {
	chatterbox: {
		enabled: () => hasCommand( 'uv' ),
		voice() {
			const file = process.env.CHATTERBOX_VOICE;

			if ( ! file ) {
				return 'default';
			}

			// The voice changes when the reference file changes.
			return crypto
				.createHash( 'sha1' )
				.update( fs.readFileSync( file ) )
				.digest( 'hex' );
		},
		// One run for all steps, loading the model takes a while.
		speakAll( items ) {
			const job = {
				language: 'nl',
				voice: process.env.CHATTERBOX_VOICE
					? path.resolve( process.env.CHATTERBOX_VOICE )
					: null,
				items: items.map( ( item ) => ( {
					text: item.text,
					file: item.file.replace( /\.wav$/, '.raw.wav' ),
				} ) ),
			};

			const result = spawnSync(
				'uv',
				[ 'run', path.join( __dirname, 'tts-chatterbox.py' ) ],
				{
					input: JSON.stringify( job ),
					stdio: [ 'pipe', 'inherit', 'inherit' ],
				}
			);

			if ( 0 !== result.status ) {
				throw new Error(
					`Chatterbox failed: status ${ result.status }, signal ${ result.signal }.`
				);
			}

			for ( const item of job.items ) {
				convert(
					item.file,
					item.file.replace( /\.raw\.wav$/, '.wav' )
				);
				fs.unlinkSync( item.file );
			}
		},
	},
	elevenlabs: {
		enabled: () => !! process.env.ELEVENLABS_API_KEY,
		// "George", a premade voice that speaks Dutch with the multilingual model.
		voice: () => process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb',
		async speak( text, file ) {
			const response = await fetch(
				`https://api.elevenlabs.io/v1/text-to-speech/${ this.voice() }?output_format=mp3_44100_128`,
				{
					method: 'POST',
					headers: {
						'xi-api-key': process.env.ELEVENLABS_API_KEY,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify( {
						text,
						model_id: 'eleven_multilingual_v2',
						language_code: 'nl',
					} ),
				}
			);

			await toWav( response, file );
		},
	},
	openai: {
		enabled: () => !! process.env.OPENAI_API_KEY,
		voice: () => process.env.OPENAI_VOICE || 'coral',
		async speak( text, file ) {
			const response = await fetch(
				'https://api.openai.com/v1/audio/speech',
				{
					method: 'POST',
					headers: {
						Authorization: `Bearer ${ process.env.OPENAI_API_KEY }`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify( {
						model: 'gpt-4o-mini-tts',
						voice: this.voice(),
						input: text,
						instructions:
							'Spreek Nederlands met een Nederlandse uitspraak. Vriendelijk, rustig en duidelijk, als in een instructievideo.',
						response_format: 'mp3',
					} ),
				}
			);

			await toWav( response, file );
		},
	},
	say: {
		enabled: () => 'darwin' === process.platform,
		voice: () => 'Xander',
		async speak( text, file ) {
			const aiff = file.replace( /\.wav$/, '.aiff' );

			run( 'say', [ '-v', this.voice(), '-r', '175', '-o', aiff, text ] );
			convert( aiff, file );
			fs.unlinkSync( aiff );
		},
	},
};

/**
 * Convert audio to the WAV format that `compose.js` mixes: 48 kHz mono,
 * without silence at the start and the end.
 *
 * @param {string} input  Input file.
 * @param {string} output Output file.
 * @return {void}
 */
function convert( input, output ) {
	run( 'ffmpeg', [
		'-v',
		'error',
		'-y',
		'-i',
		input,
		'-af',
		'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse',
		'-ar',
		'48000',
		'-ac',
		'1',
		output,
	] );
}

/**
 * Save an MP3 response as WAV.
 *
 * @param {Response} response Fetch response.
 * @param {string}   file     WAV file.
 * @return {Promise<void>}
 */
async function toWav( response, file ) {
	if ( ! response.ok ) {
		throw new Error(
			`Text-to-speech failed: ${ response.status } ${ await response.text() }`
		);
	}

	const mp3 = file.replace( /\.wav$/, '.mp3' );

	fs.writeFileSync( mp3, Buffer.from( await response.arrayBuffer() ) );
	convert( mp3, file );
	fs.unlinkSync( mp3 );
}

/**
 * Text for the speech engine, with the pronunciation fixes of the script.
 *
 * @param {string}                text          Text.
 * @param {Object<string,string>} pronunciation Replacements.
 * @return {string} Text.
 */
const spoken = ( text, pronunciation ) =>
	Object.entries( pronunciation ).reduce(
		( result, [ search, replace ] ) =>
			result.split( search ).join( replace ),
		text
	);

( async () => {
	const name =
		process.env.TTS_PROVIDER ||
		Object.keys( providers ).find( ( key ) => providers[ key ].enabled() );

	if ( ! ( name in providers ) ) {
		throw new Error(
			`No text-to-speech provider ${ name ?? '' }, install uv or set TTS_PROVIDER.`
		);
	}

	const provider = providers[ name ];

	const script = readScript();

	fs.mkdirSync( dirs.audio, { recursive: true } );

	const voice = provider.voice();

	const steps = allSteps( script ).map( ( step ) => {
		const text = spoken( step.text, script.pronunciation ?? {} );

		const hash = crypto
			.createHash( 'sha1' )
			.update( [ format, name, voice, text ].join( '\n' ) )
			.digest( 'hex' );

		const file = path.join( dirs.audio, `${ step.id }.wav` );
		const hashFile = path.join( dirs.audio, `${ step.id }.hash` );

		const cached =
			fs.existsSync( file ) &&
			fs.existsSync( hashFile ) &&
			hash === fs.readFileSync( hashFile, 'utf8' );

		return { id: step.id, text, file, hash, hashFile, cached };
	} );

	const todo = steps.filter( ( step ) => ! step.cached );

	if ( todo.length > 0 ) {
		process.stdout.write( `${ name }: ${ todo.length } steps\n` );

		if ( provider.speakAll ) {
			provider.speakAll( todo );
		} else {
			for ( const step of todo ) {
				process.stdout.write( `${ name }: ${ step.id }\n` );

				await provider.speak( step.text, step.file );
			}
		}

		for ( const step of todo ) {
			fs.writeFileSync( step.hashFile, step.hash );
		}
	}

	const durations = {};

	for ( const step of steps ) {
		durations[ step.id ] = mediaDuration( step.file );
	}

	fs.writeFileSync(
		path.join( dirs.audio, 'durations.json' ),
		JSON.stringify( durations, null, '\t' ) + '\n'
	);

	const total = Object.values( durations ).reduce( ( a, b ) => a + b, 0 );

	process.stdout.write(
		`${ Object.keys( durations ).length } steps, ${ Math.round(
			total
		) } seconds of narration.\n`
	);
} )().catch( ( error ) => {
	process.stderr.write( `${ error.message }\n` );
	process.exit( 1 );
} );
