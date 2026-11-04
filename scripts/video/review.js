/**
 * Frames of the video for a review, e.g. by Claude, which reads images but
 * not videos.
 *
 * Writes to `build/video/frames`:
 *
 * - `<scene>-0001.png`: a full size frame every 2 seconds per segment.
 * - `<scene>-sheet.png`: a contact sheet per segment, to see a whole scene
 *   in one image: the same frames, left to right, top to bottom.
 *
 * Usage: `npm run video:review`, after `npm run video:compose`.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { dirs, readScript, mediaDuration, run } = require( './lib' );

const interval = 2;

fs.rmSync( dirs.frames, { recursive: true, force: true } );
fs.mkdirSync( dirs.frames, { recursive: true } );

for ( const scene of readScript().scenes ) {
	const file = path.join( dirs.segments, `${ scene.id }.mp4` );

	if ( ! fs.existsSync( file ) ) {
		continue;
	}

	run( 'ffmpeg', [
		'-v',
		'error',
		'-i',
		file,
		'-vf',
		`fps=1/${ interval }`,
		path.join( dirs.frames, `${ scene.id }-%04d.png` ),
	] );

	const count = Math.max( 1, Math.ceil( mediaDuration( file ) / interval ) );
	const columns = Math.min( 4, count );
	const rows = Math.ceil( count / columns );

	run( 'ffmpeg', [
		'-v',
		'error',
		'-i',
		file,
		'-vf',
		`fps=1/${ interval },scale=480:-1,tile=${ columns }x${ rows }:padding=4`,
		'-frames:v',
		'1',
		path.join( dirs.frames, `${ scene.id }-sheet.png` ),
	] );

	process.stdout.write( `${ scene.id }: ${ count } frames\n` );
}
