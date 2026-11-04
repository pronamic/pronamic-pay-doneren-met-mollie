/**
 * Render the title cards of the video, e.g. the intro and the outro.
 *
 * Same look as the framed screenshots of `../screenshots/frame.js`: a
 * Pronamic purple background with the plugin icon and name.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { chromium } = require( '@playwright/test' );
const { root, dirs, output } = require( './lib' );

const style = `
	* { box-sizing: border-box; margin: 0; padding: 0; }

	html, body {
		width: 100%;
		height: 100%;
	}

	body {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: 40px;
		padding: 160px;
		background:
			radial-gradient( circle 626px at 1472px 375px, rgba( 255, 255, 255, 0.05 ) 99.9%, transparent 100% ),
			radial-gradient( circle 760px at 1321px -215px, rgba( 255, 255, 255, 0.05 ) 99.9%, transparent 100% ),
			radial-gradient( circle 760px at 1881px 671px, rgba( 255, 255, 255, 0.05 ) 99.9%, transparent 100% ),
			linear-gradient( to right, #321965, #21103c );
		color: #fff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	header img {
		width: 112px;
		height: 112px;
		border-radius: 24px;
	}

	.plugin {
		font-size: 36px;
		font-weight: 500;
		opacity: 0.85;
	}

	h1 {
		max-width: 1400px;
		font-size: 88px;
		font-weight: 700;
		line-height: 1.1;
	}

	p {
		font-size: 44px;
		opacity: 0.85;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 16px;
		list-style: none;
		font-size: 40px;
	}

	li::before {
		content: "→ ";
		opacity: 0.6;
	}
`;

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
			( { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } )[
				char
			]
	);

/**
 * Render the cards of the script to `build/video/cards/<scene>.png`.
 *
 * @param {Object} script Script.
 * @return {Promise<void>}
 */
async function renderCards( script ) {
	const readme = fs.readFileSync( path.join( root, 'readme.txt' ), 'utf8' );

	const name = readme.match( /^=== (.+) ===$/m )[ 1 ];

	const icon = fs
		.readFileSync( path.join( root, '.wordpress-org/icon.svg' ) )
		.toString( 'base64' );

	fs.mkdirSync( dirs.cards, { recursive: true } );

	const browser = await chromium.launch();

	const page = await browser.newPage( {
		viewport: { width: output.width, height: output.height },
	} );

	for ( const scene of script.scenes.filter( ( item ) => item.card ) ) {
		const { title, subtitle, lines = [] } = scene.card;

		await page.setContent( `<!DOCTYPE html>
			<html lang="nl">
			<head><meta charset="utf-8"><style>${ style }</style></head>
			<body>
				<header>
					<img src="data:image/svg+xml;base64,${ icon }" alt="">
					<div class="plugin">${ escapeHtml( name ) }</div>
				</header>
				<h1>${ escapeHtml( title ) }</h1>
				${ subtitle ? `<p>${ escapeHtml( subtitle ) }</p>` : '' }
				${
					lines.length
						? `<ul>${ lines
								.map(
									( line ) =>
										`<li>${ escapeHtml( line ) }</li>`
								)
								.join( '' ) }</ul>`
						: ''
				}
			</body>
			</html>` );

		await page.evaluate( () => document.fonts.ready );

		await page.screenshot( {
			path: path.join( dirs.cards, `${ scene.id }.png` ),
		} );
	}

	await browser.close();
}

module.exports = { renderCards };
