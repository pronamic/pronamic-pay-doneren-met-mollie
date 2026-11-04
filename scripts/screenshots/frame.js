/**
 * Frame the screenshots for wordpress.org and the README.
 *
 * Places the raw screenshots from `build/screenshots` on a canvas of a fixed
 * size with a Pronamic orange background, the plugin icon, the plugin name
 * and a title, and writes them to `.wordpress-org`. The titles are the
 * captions in the `== Screenshots ==` section of `readme.txt`. Adjust the
 * CSS variables in `style` to change the look.
 *
 * Usage: `npm run screenshots:frame`, no WordPress needed.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { chromium } = require( '@playwright/test' );

const root = path.join( __dirname, '../..' );
const inputDir = path.join( root, 'build/screenshots' );
const outputDir = path.join( root, '.wordpress-org' );

// The raw screenshots are taken with a device scale factor of 2.
const scale = 2;

// Canvas size in CSS pixels, the same for all screenshots.
const canvas = { width: 1600, height: 1000 };

const padding = 64;
const headerHeight = 72;
const gap = 48;

/*
 * The "Glass Light" style of Screenshot Studio without shadow, see
 * https://github.com/opennookorg/screenshot-studio, `setImageStylePreset()`
 * in `lib/store/index.ts` and `HTMLMainImageLayer.tsx`.
 */
const style = `
	:root {
		--background: #f9461c;
		--padding: ${ padding }px;
		--header-height: ${ headerHeight }px;
		--gap: ${ gap }px;
		--glass-background: rgba( 255, 255, 255, 0.25 );
		--radius: 10px;
	}

	* { box-sizing: border-box; margin: 0; padding: 0; }

	html, body {
		width: 100%;
		height: 100%;
	}

	body {
		display: flex;
		flex-direction: column;
		gap: var(--gap);
		padding: var(--padding);
		background: var(--background);
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		gap: 24px;
		height: var(--header-height);
	}

	header img {
		width: var(--header-height);
		height: var(--header-height);
		border-radius: 16px;
	}

	.plugin {
		font-size: 20px;
		font-weight: 500;
		opacity: 0.85;
	}

	h1 {
		font-size: 40px;
		font-weight: 700;
		line-height: 1.2;
	}

	main {
		display: flex;
		flex: 1;
		align-items: center;
		justify-content: center;
		min-height: 0;
	}

	.glass {
		overflow: hidden;
		padding: var(--glass-padding);
		border-radius: calc( var(--radius) + var(--glass-padding) );
		background: var(--glass-background);
	}

	.glass img {
		display: block;
		border-radius: var(--radius);
	}
`;

/**
 * PNG size in pixels, read from the IHDR chunk.
 *
 * @param {Buffer} png PNG data.
 * @return {{width: number, height: number}} Size.
 */
const pngSize = ( png ) => ( {
	width: png.readUInt32BE( 16 ),
	height: png.readUInt32BE( 20 ),
} );

/**
 * Escape text for HTML.
 *
 * @param {string} text Text.
 * @return {string} Escaped text.
 */
const escapeHtml = ( text ) =>
	text.replace(
		/[&<>"]/g,
		( char ) =>
			( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } )[ char ]
	);

/**
 * Plugin name and screenshot captions from `readme.txt`.
 *
 * @return {{name: string, captions: Object<number, string>}} Readme data.
 */
function readReadme() {
	const readme = fs.readFileSync( path.join( root, 'readme.txt' ), 'utf8' );

	const name = readme.match( /^=== (.+) ===$/m )[ 1 ];

	const section = readme.match( /^== Screenshots ==$([\s\S]*?)^== /m )[ 1 ];

	const captions = {};

	for ( const match of section.matchAll( /^(\d+)\. (.+?)\.?$/gm ) ) {
		captions[ match[ 1 ] ] = match[ 2 ];
	}

	return { name, captions };
}

( async () => {
	if ( ! fs.existsSync( inputDir ) ) {
		throw new Error( `No screenshots in ${ inputDir }, run \`npm run screenshots\` first.` );
	}

	const { name, captions } = readReadme();

	const icon = fs
		.readFileSync( path.join( outputDir, 'icon.svg' ) )
		.toString( 'base64' );

	const files = fs
		.readdirSync( inputDir )
		.filter( ( file ) => /^screenshot-\d+\.png$/.test( file ) );

	// Space for the screenshot, below the header.
	const area = {
		width: canvas.width - 2 * padding,
		height: canvas.height - 2 * padding - headerHeight - gap,
	};

	const browser = await chromium.launch();

	const page = await browser.newPage( {
		viewport: canvas,
		deviceScaleFactor: scale,
	} );

	for ( const file of files ) {
		const number = file.match( /\d+/ )[ 0 ];

		if ( ! ( number in captions ) ) {
			throw new Error( `No caption for ${ file } in readme.txt.` );
		}

		const png = fs.readFileSync( path.join( inputDir, file ) );
		const size = pngSize( png );

		/*
		 * Fit the screenshot and its glass border in the area, never
		 * larger than the raw screenshot.
		 */
		const glassPadding = 12;

		const fit = Math.min(
			1,
			( area.width - 2 * glassPadding ) / ( size.width / scale ),
			( area.height - 2 * glassPadding ) / ( size.height / scale )
		);

		const width = Math.floor( ( size.width / scale ) * fit );
		const height = Math.floor( ( size.height / scale ) * fit );

		await page.setContent( `<!DOCTYPE html>
			<html>
			<head><style>${ style }</style></head>
			<body>
				<header>
					<img src="data:image/svg+xml;base64,${ icon }" alt="">
					<div>
						<div class="plugin">${ escapeHtml( name ) }</div>
						<h1>${ escapeHtml( captions[ number ] ) }</h1>
					</div>
				</header>
				<main>
					<div class="glass" style="--glass-padding: ${ glassPadding }px">
						<img src="data:image/png;base64,${ png.toString( 'base64' ) }" width="${ width }" height="${ height }">
					</div>
				</main>
			</body>
			</html>` );

		await page.evaluate( () => document.fonts.ready );

		await page.screenshot( { path: path.join( outputDir, file ) } );
	}

	await browser.close();
} )();
