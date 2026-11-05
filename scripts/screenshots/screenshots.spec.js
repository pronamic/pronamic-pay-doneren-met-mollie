/**
 * Screenshots for wordpress.org, the README and marketing.
 *
 * The numbers match the `== Screenshots ==` section in `readme.txt`. The raw
 * screenshots go to `build/screenshots`, `frame.js` frames them into
 * `.wordpress-org`.
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	isolatePlugin,
	restorePlugins,
	setUserLocale,
	deleteGateway,
	openEditor,
	settle,
	hideNotices,
} = require( '../shared/wp' );

const root = path.join( __dirname, '../..' );

const screenshotPath = ( number ) =>
	path.join( root, 'build/screenshots', `screenshot-${ number }.png` );

const readContent = ( file ) =>
	fs.readFileSync( path.join( __dirname, 'content', file ), 'utf8' );

/**
 * Pronamic Forms pattern content in English.
 *
 * The blocks of a `wp:pattern` reference can't be selected in the editor,
 * and WordPress translates registered patterns to the site language. So read
 * the pattern file and keep the English source strings.
 *
 * @param {string} slug Pattern slug, without `pronamic/`.
 * @return {string} Block markup.
 */
function patternContent( slug ) {
	const file = path.join(
		root,
		'packages/pronamic/wp-pronamic-forms/patterns',
		`${ slug }.php`
	);

	const content = fs
		.readFileSync( file, 'utf8' )
		.replace( /^<\?php[\s\S]*?\?>\s*/, '' )
		.replace(
			/<\?php (?:\\esc_html_e|echo \\esc_html_x)\( '((?:[^'\\]|\\.)*)'.*?\?>/g,
			( match, text ) => text.replace( /\\'/g, "'" )
		);

	if ( content.includes( '<?php' ) ) {
		throw new Error( `Unsupported PHP in ${ file }.` );
	}

	return content;
}

test.describe( 'Screenshots', () => {
	const pages = {};

	let gatewayId = null;

	let deactivatedPlugins = [];

	test.beforeAll( async ( { requestUtils } ) => {
		deactivatedPlugins = await isolatePlugin( requestUtils );

		// Screenshots in English, `.wp-env.json` sets the site to Dutch.
		await setUserLocale( requestUtils, 'en_US' );

		// No starter patterns modal for new posts and pages.
		await requestUtils.setPreferences( 'core', {
			enableChoosePatternModal: false,
		} );

		const content = readContent( 'donation-form.html' ).replace(
			/<!-- wp:pattern \{"slug":"pronamic\/([^"]+)"\} \/-->/g,
			( match, slug ) => patternContent( slug )
		);

		pages.donate = await requestUtils.createPage( {
			title: 'Donate',
			content,
			status: 'publish',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		for ( const page of Object.values( pages ) ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ page.id }`,
				params: { force: true },
			} );
		}

		await restorePlugins( requestUtils, deactivatedPlugins );

		// Back to the site language.
		await setUserLocale( requestUtils, '' );

		await requestUtils.setPreferences( 'core', {
			enableChoosePatternModal: true,
		} );
	} );

	test.describe( 'Frontend', () => {
		// Logged out, so without the admin bar.
		test.use( { storageState: { cookies: [], origins: [] } } );

		test( '1. Donation form on the frontend', async ( { page } ) => {
			await page.goto( pages.donate.link );

			// Some space above and below the form.
			await page.addStyleTag( {
				content: `.wp-block-post-content { padding-block: 48px; }`,
			} );

			await settle( page );

			await page
				.locator( '.wp-block-post-content' )
				.screenshot( { path: screenshotPath( 1 ) } );
		} );
	} );

	test( '2. Donation form pattern in the inserter', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openEditor( { admin, editor, page }, null );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();

		const inserter = page.getByRole( 'region', { name: 'Block Library' } );

		await inserter.getByRole( 'tab', { name: 'Patterns' } ).click();
		await inserter.getByRole( 'tab', { name: 'Pronamic forms' } ).click();

		const pattern = page.getByRole( 'option', { name: 'Donation form' } );

		await expect( pattern ).toBeVisible();

		await settle( page );

		// Crop to the inserter, down to the donation form pattern.
		const panel = await page
			.locator( '.block-editor-inserter__category-panel' )
			.boundingBox();

		const option = await pattern.boundingBox();

		await page.screenshot( {
			path: screenshotPath( 2 ),
			clip: {
				x: 0,
				y: panel.y,
				width: panel.x + panel.width,
				height: option.y + option.height + 24 - panel.y,
			},
		} );
	} );

	test( '3. Donation form in the block editor', async ( {
		admin,
		editor,
		page,
	} ) => {
		await openEditor( { admin, editor, page }, pages.donate.id, {
			fixedToolbar: true,
		} );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Subscription frequency choice field',
			} )
		);

		await editor.openDocumentSettingsSidebar();

		await settle( page );

		await page.screenshot( { path: screenshotPath( 3 ) } );
	} );

	test( '4. Mollie configuration with API key', async ( { admin, page } ) => {
		await admin.visitAdminPage(
			'post-new.php',
			'post_type=pronamic_gateway'
		);

		await page.locator( '#title' ).fill( 'Mollie' );
		await page.locator( '#pronamic_gateway_id' ).selectOption( 'mollie' );
		await page
			.locator( '[name="_pronamic_gateway_mollie_api_key"]' )
			.fill( 'test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM' );

		await page.locator( '#publish' ).click();
		await page.waitForURL( /post\.php\?post=\d+&action=edit/ );

		gatewayId = Number( new URL( page.url() ).searchParams.get( 'post' ) );

		// Without the "Post published" notice.
		await admin.visitAdminPage(
			'post.php',
			`post=${ gatewayId }&action=edit`
		);
		await hideNotices( page );

		// Mask the API key, like a password field, without saving it.
		await page
			.locator( '[name="_pronamic_gateway_mollie_api_key"]' )
			.fill( 'test_' + '•'.repeat( 30 ) );

		// Without the focus outline.
		await page
			.locator( '[name="_pronamic_gateway_mollie_api_key"]' )
			.blur();

		await settle( page );

		await page.screenshot( { path: screenshotPath( 4 ) } );
	} );

	test( '5. Payment gateway configurations', async ( { admin, page } ) => {
		await admin.visitAdminPage( 'edit.php', 'post_type=pronamic_gateway' );
		await hideNotices( page );
		await settle( page );

		await page.screenshot( { path: screenshotPath( 5 ) } );

		if ( null !== gatewayId ) {
			await deleteGateway( admin, page, gatewayId );
		}
	} );
} );
