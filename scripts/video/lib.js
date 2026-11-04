/**
 * Paths and helpers shared by the video scripts.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { execFileSync } = require( 'child_process' );

const root = path.join( __dirname, '../..' );

// Local secrets, such as `MOLLIE_TEST_API_KEY`, in `.env`, not in Git.
if ( fs.existsSync( path.join( root, '.env' ) ) ) {
	process.loadEnvFile( path.join( root, '.env' ) );
}

const buildDir = path.join( root, 'build/video' );

const dirs = {
	audio: path.join( buildDir, 'audio' ),
	cards: path.join( buildDir, 'cards' ),
	scenes: path.join( buildDir, 'scenes' ),
	segments: path.join( buildDir, 'segments' ),
	frames: path.join( buildDir, 'frames' ),
};

// Recording size, `compose.js` scales it up to 1080p so the UI is larger.
const viewport = { width: 1536, height: 864 };
const output = { width: 1920, height: 1080, fps: 30 };

/**
 * The video script, with the scenes and the narration.
 *
 * @return {Object} Script.
 */
function readScript() {
	return JSON.parse(
		fs.readFileSync( path.join( __dirname, 'script.json' ), 'utf8' )
	);
}

/**
 * All narration steps, in order.
 *
 * @param {Object} script Script.
 * @return {Object[]} Steps.
 */
const allSteps = ( script ) =>
	script.scenes.flatMap( ( scene ) => scene.steps );

/**
 * Duration of a media file in seconds.
 *
 * @param {string} file File.
 * @return {number} Seconds.
 */
function mediaDuration( file ) {
	return Number(
		execFileSync( 'ffprobe', [
			'-v',
			'error',
			'-show_entries',
			'format=duration',
			'-of',
			'csv=p=0',
			file,
		] )
			.toString()
			.trim()
	);
}

/**
 * Narration durations in seconds by step ID, written by `tts.js`.
 *
 * @return {Object<string, number>} Durations.
 */
function readDurations() {
	const file = path.join( dirs.audio, 'durations.json' );

	if ( ! fs.existsSync( file ) ) {
		throw new Error( `No ${ file }, run \`npm run video:tts\` first.` );
	}

	return JSON.parse( fs.readFileSync( file, 'utf8' ) );
}

/**
 * Run a command and fail loudly.
 *
 * @param {string}   command Command.
 * @param {string[]} args    Arguments.
 * @return {void}
 */
function run( command, args ) {
	execFileSync( command, args, { stdio: [ 'ignore', 'ignore', 'inherit' ] } );
}

module.exports = {
	root,
	buildDir,
	dirs,
	viewport,
	output,
	readScript,
	allSteps,
	mediaDuration,
	readDurations,
	run,
};
