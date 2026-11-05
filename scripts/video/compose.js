/**
 * Compose the video from the cards, the recorded scenes and the narration.
 *
 * For every scene a segment in `build/video/segments`: the recording, cut to
 * the narration steps, scaled up to 1080p, with each narration step placed
 * at the moment it was recorded. The segments are joined into
 * `build/video/<output>.mp4`, with subtitles (`.srt`) and YouTube chapters
 * (`-chapters.txt`) next to it.
 *
 * Usage: `npm run video:compose`, no WordPress needed.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const {
	buildDir,
	dirs,
	output,
	readScript,
	readDurations,
	mediaDuration,
	run,
} = require( './lib' );
const { renderCards } = require( './cards' );

// Seconds before the first and after the last narration on a card.
const cardLead = 0.6;
const cardTail = 1.2;
const cardGap = 0.4;

// Seconds of the recording to keep before the first narration step.
const sceneLead = 0.5;

const fade = 0.3;

const encodeArgs = [
	'-c:v',
	'libx264',
	'-preset',
	'medium',
	'-crf',
	'18',
	'-pix_fmt',
	'yuv420p',
	'-r',
	String( output.fps ),
	'-c:a',
	'aac',
	'-b:a',
	'192k',
	'-ar',
	'48000',
	'-ac',
	'2',
];

/**
 * Audio filter that places the narration steps at their offsets.
 *
 * @param {Object[]} steps      Steps with `offset` in seconds.
 * @param {number}   firstInput Input index of the first step.
 * @param {number}   duration   Segment duration.
 * @return {string} Filter graph, output `[a]`.
 */
function audioFilter( steps, firstInput, duration ) {
	const parts = steps.map( ( step, index ) => {
		const ms = Math.round( step.offset * 1000 );

		return `[${ firstInput + index }:a]adelay=${ ms }:all=1[s${ index }]`;
	} );

	const inputs = steps.map( ( step, index ) => `[s${ index }]` ).join( '' );

	parts.push(
		`${ inputs }amix=inputs=${ steps.length }:normalize=0,apad,atrim=0:${ duration.toFixed(
			3
		) }[a]`
	);

	return parts.join( ';' );
}

/**
 * Video fade in and out.
 *
 * The first segment starts without a fade in, so the first frame of the
 * video shows the intro instead of black.
 *
 * @param {number}  duration Segment duration.
 * @param {boolean} first    Whether this is the first segment.
 * @return {string} Filter.
 */
const fades = ( duration, first ) =>
	[
		...( first ? [] : [ `fade=t=in:st=0:d=${ fade }` ] ),
		`fade=t=out:st=${ ( duration - fade ).toFixed( 3 ) }:d=${ fade }`,
	].join( ',' );

/**
 * Segment of a title card.
 *
 * @param {Object}                scene     Scene.
 * @param {Object<string,number>} durations Narration durations.
 * @param {string}                file      Output file.
 * @param {boolean}               first     Whether this is the first segment.
 * @return {Object[]} Steps with offsets.
 */
function cardSegment( scene, durations, file, first ) {
	let offset = cardLead;

	const steps = scene.steps.map( ( step ) => {
		const item = { ...step, offset };

		offset += durations[ step.id ] + cardGap;

		return item;
	} );

	const duration = offset - cardGap + cardTail;

	run( 'ffmpeg', [
		'-v',
		'error',
		'-y',
		'-loop',
		'1',
		'-framerate',
		String( output.fps ),
		'-t',
		duration.toFixed( 3 ),
		'-i',
		path.join( dirs.cards, `${ scene.id }.png` ),
		...steps.flatMap( ( step ) => [
			'-i',
			path.join( dirs.audio, `${ step.id }.wav` ),
		] ),
		'-filter_complex',
		`[0:v]${ fades( duration, first ) }[v];${ audioFilter( steps, 1, duration ) }`,
		'-map',
		'[v]',
		'-map',
		'[a]',
		...encodeArgs,
		file,
	] );

	return steps;
}

/**
 * Segment of a recorded scene.
 *
 * @param {Object}  scene    Scene.
 * @param {Object}  timeline Timeline written by the recording.
 * @param {string}  file     Output file.
 * @param {boolean} first    Whether this is the first segment.
 * @return {Object[]} Steps with offsets.
 */
function recordedSegment( scene, timeline, file, first ) {
	const start = Math.max( 0, timeline.steps[ 0 ].at - sceneLead );
	const duration = timeline.end - start;

	const texts = Object.fromEntries(
		scene.steps.map( ( step ) => [ step.id, step.text ] )
	);

	const steps = timeline.steps.map( ( step ) => ( {
		id: step.id,
		text: texts[ step.id ],
		offset: step.at - start,
	} ) );

	run( 'ffmpeg', [
		'-v',
		'error',
		'-y',
		'-i',
		path.join( dirs.scenes, `${ scene.id }.webm` ),
		...steps.flatMap( ( step ) => [
			'-i',
			path.join( dirs.audio, `${ step.id }.wav` ),
		] ),
		'-filter_complex',
		[
			`[0:v]trim=start=${ start.toFixed( 3 ) }:duration=${ duration.toFixed(
				3
			) },setpts=PTS-STARTPTS,fps=${ output.fps },scale=${
				output.width
			}:${ output.height }:flags=lanczos,${ fades(
				duration,
				first
			) }[v]`,
			audioFilter( steps, 1, duration ),
		].join( ';' ),
		'-map',
		'[v]',
		'-map',
		'[a]',
		...encodeArgs,
		file,
	] );

	return steps;
}

/**
 * Time for SRT, e.g. `00:01:02,345`.
 *
 * @param {number} seconds Seconds.
 * @return {string} Time.
 */
function srtTime( seconds ) {
	const ms = Math.round( seconds * 1000 );

	const pad = ( value, length = 2 ) =>
		String( value ).padStart( length, '0' );

	return `${ pad( Math.floor( ms / 3600000 ) ) }:${ pad(
		Math.floor( ms / 60000 ) % 60
	) }:${ pad( Math.floor( ms / 1000 ) % 60 ) },${ pad( ms % 1000, 3 ) }`;
}

/**
 * Time for YouTube chapters, e.g. `1:02`.
 *
 * @param {number} seconds Seconds.
 * @return {string} Time.
 */
const chapterTime = ( seconds ) =>
	`${ Math.floor( seconds / 60 ) }:${ String(
		Math.floor( seconds % 60 )
	).padStart( 2, '0' ) }`;

/**
 * Subtitle cues of a step: one per sentence, timed by length.
 *
 * @param {string} text     Text.
 * @param {number} start    Start in seconds.
 * @param {number} duration Duration in seconds.
 * @return {Object[]} Cues.
 */
function cues( text, start, duration ) {
	const sentences = text
		.match( /[^.!?]+[.!?]*/g )
		.map( ( item ) => item.trim() );

	const total = sentences.reduce( ( sum, item ) => sum + item.length, 0 );

	let at = start;

	return sentences.map( ( sentence ) => {
		const length = ( sentence.length / total ) * duration;

		const cue = { start: at, end: at + length, text: sentence };

		at += length;

		return cue;
	} );
}

( async () => {
	const script = readScript();
	const durations = readDurations();

	await renderCards( script );

	fs.mkdirSync( dirs.segments, { recursive: true } );

	const segments = [];
	const subtitles = [];
	const chapters = [];

	let offset = 0;

	for ( const scene of script.scenes ) {
		const file = path.join( dirs.segments, `${ scene.id }.mp4` );

		let steps;

		if ( scene.card ) {
			steps = cardSegment(
				scene,
				durations,
				file,
				0 === segments.length
			);
		} else {
			const timelineFile = path.join( dirs.scenes, `${ scene.id }.json` );

			if ( ! fs.existsSync( timelineFile ) ) {
				throw new Error(
					`No recording of scene ${ scene.id }, run \`npm run video:record\` first.`
				);
			}

			const timeline = JSON.parse(
				fs.readFileSync( timelineFile, 'utf8' )
			);

			if ( timeline.skipped ) {
				process.stdout.write(
					`Skipped ${ scene.id }: ${ timeline.skipped }\n`
				);

				continue;
			}

			steps = recordedSegment(
				scene,
				timeline,
				file,
				0 === segments.length
			);
		}

		process.stdout.write( `Segment ${ scene.id }\n` );

		for ( const step of steps ) {
			subtitles.push(
				...cues( step.text, offset + step.offset, durations[ step.id ] )
			);
		}

		chapters.push( `${ chapterTime( offset ) } ${ scene.chapter }` );

		segments.push( file );

		offset += mediaDuration( file );
	}

	const base = path.join( buildDir, script.output );
	const list = path.join( dirs.segments, 'list.txt' );

	fs.writeFileSync(
		list,
		segments.map( ( file ) => `file '${ file }'` ).join( '\n' ) + '\n'
	);

	// Join, and normalize the loudness for YouTube.
	run( 'ffmpeg', [
		'-v',
		'error',
		'-y',
		'-f',
		'concat',
		'-safe',
		'0',
		'-i',
		list,
		'-c:v',
		'copy',
		'-af',
		'loudnorm=I=-14:TP=-1.5:LRA=11',
		'-c:a',
		'aac',
		'-b:a',
		'192k',
		'-ar',
		'48000',
		'-movflags',
		'+faststart',
		`${ base }.mp4`,
	] );

	fs.writeFileSync(
		`${ base }.srt`,
		subtitles
			.map(
				( cue, index ) =>
					`${ index + 1 }\n${ srtTime( cue.start ) } --> ${ srtTime(
						cue.end
					) }\n${ cue.text }\n`
			)
			.join( '\n' )
	);

	fs.writeFileSync( `${ base }-chapters.txt`, chapters.join( '\n' ) + '\n' );

	process.stdout.write(
		`${ base }.mp4, ${ Math.round( mediaDuration( `${ base }.mp4` ) ) } seconds.\n`
	);
} )().catch( ( error ) => {
	process.stderr.write( `${ error.stack }\n` );
	process.exit( 1 );
} );
