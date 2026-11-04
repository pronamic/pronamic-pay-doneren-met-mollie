/**
 * Frame the screenshots for wordpress.org and the README.
 *
 * Places the raw screenshots from `build/screenshots` in a "glass light"
 * frame on a Pronamic orange background and writes them to `.wordpress-org`.
 * Adjust the CSS variables in `style` to change the look.
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

/*
 * The "Glass Light" style of Screenshot Studio without shadow, see
 * https://github.com/opennookorg/screenshot-studio, `setImageStylePreset()`
 * in `lib/store/index.ts` and `HTMLMainImageLayer.tsx`.
 */
const style = `
	:root {
		--background: #f9461c;
		--padding: 64px;
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
		align-items: center;
		justify-content: center;
		padding: var(--padding);
		background: var(--background);
	}

	.glass {
		overflow: hidden;
		padding: var(--glass-padding);
		border-radius: calc( var(--radius) + var(--glass-padding) );
		background: var(--glass-background);
	}

	img {
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

( async () => {
	if ( ! fs.existsSync( inputDir ) ) {
		throw new Error( `No screenshots in ${ inputDir }, run \`npm run screenshots\` first.` );
	}

	const files = fs
		.readdirSync( inputDir )
		.filter( ( file ) => /^screenshot-\d+\.png$/.test( file ) );

	const browser = await chromium.launch();

	for ( const file of files ) {
		const png = fs.readFileSync( path.join( inputDir, file ) );
		const size = pngSize( png );
		const width = size.width / scale;
		const height = size.height / scale;

		const page = await browser.newPage( {
			viewport: { width: width + 400, height: height + 400 },
			deviceScaleFactor: scale,
		} );

		await page.setContent( `<!DOCTYPE html>
			<html>
			<head><style>${ style }</style></head>
			<body>
				<div class="glass" style="--glass-padding: ${ Math.round( width * 0.01 ) }px">
					<img src="data:image/png;base64,${ png.toString( 'base64' ) }" width="${ width }" height="${ height }">
				</div>
			</body>
			</html>` );

		// Size the page to the frame, including padding and glass border.
		const box = await page.evaluate( () => {
			const rect = document.querySelector( '.glass' ).getBoundingClientRect();
			const padding = parseFloat( getComputedStyle( document.body ).paddingLeft );

			return {
				width: Math.ceil( rect.width + 2 * padding ),
				height: Math.ceil( rect.height + 2 * padding ),
			};
		} );

		await page.setViewportSize( box );
		await page.screenshot( { path: path.join( outputDir, file ) } );
		await page.close();
	}

	await browser.close();
} )();
