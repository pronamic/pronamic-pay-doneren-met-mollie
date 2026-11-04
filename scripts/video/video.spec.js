/**
 * Record the scenes of the how-to video, in Dutch.
 *
 * One test per scene from `script.json`, each with its own video in
 * `build/video/scenes`. The scenes build on each other, so run them in
 * order: the configuration of the `mollie` scene and the page of the `form`
 * scene are used by the `donate` scene.
 *
 * With `MOLLIE_TEST_API_KEY` the donation is paid on the Mollie test
 * checkout, without it the video stops at the "Donate" button.
 */
const { execFileSync } = require( 'child_process' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	isolatePlugin,
	restorePlugins,
	setUserLocale,
	hideAdminBarCss,
} = require( '../shared/wp' );
const { Director } = require( './director' );

const mollieApiKey = process.env.MOLLIE_TEST_API_KEY ?? null;

// Not a real API key, the field is masked in the video.
const fakeApiKey = 'test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM';

/*
 * Clean admin pages: no notices, except the "Post published" message, and
 * the API key masked like a password.
 */
const adminCss = `
	#wpbody-content .notice:not( #message ) { display: none !important; }
	[name="_pronamic_gateway_mollie_api_key"] { -webkit-text-security: disc; }
`;

/**
 * Add the fake cursor and the CSS to every page.
 *
 * @param {import('@playwright/test').Page} page Page.
 * @param {string}                          css  CSS.
 * @return {Promise<void>}
 */
async function preparePage( page, css = adminCss ) {
	await Director.prepare( page );

	await page.addInitScript( ( content ) => {
		document.addEventListener( 'DOMContentLoaded', () => {
			const style = document.createElement( 'style' );

			style.textContent = content;

			document.head.appendChild( style );
		} );
	}, css );
}

/**
 * Run WP-CLI in `wp-env`.
 *
 * @param {...string} args Arguments.
 * @return {string} Output.
 */
const wpCli = ( ...args ) =>
	execFileSync( 'npx', [ 'wp-env', 'run', 'cli', 'wp', ...args ], {
		stdio: [ 'ignore', 'pipe', 'ignore' ],
	} )
		.toString()
		.trim();

/**
 * Get an option with WP-CLI.
 *
 * @param {string} name Option name.
 * @return {string|null} Value, `null` if the option doesn't exist.
 */
function wpCliOption( name ) {
	try {
		return wpCli( 'option', 'get', name );
	} catch {
		return null;
	}
}

test.describe( 'Video', () => {
	const created = { pages: [], gateways: [] };

	let deactivatedPlugins = [];

	let donatePage = null;

	// A site title for the frontend, instead of the `wp-env` directory name.
	const siteTitle = 'Stichting Voorbeeld';

	let originalSiteTitle = null;

	// Without a page for completed payments, visitors return to the home page.
	let originalCompletedPage = null;

	// Posts with a higher ID are created by the recording: the donation.
	let lastPostId = 0;

	test.beforeAll( async ( { requestUtils } ) => {
		deactivatedPlugins = await isolatePlugin( requestUtils );

		// The site language of `.wp-env.json`: Dutch, with the translations.
		await setUserLocale( requestUtils, '' );

		wpCli( 'language', 'core', 'install', 'nl_NL' );
		wpCli( 'language', 'theme', 'install', '--all', 'nl_NL' );

		originalSiteTitle = wpCli( 'option', 'get', 'blogname' );

		wpCli( 'option', 'update', 'blogname', siteTitle );

		lastPostId = Number(
			wpCli(
				'db',
				'query',
				'SELECT MAX( ID ) FROM wp_posts',
				'--skip-column-names'
			)
		);

		originalCompletedPage = wpCliOption( 'pronamic_pay_completed_page_id' );

		const thanks = await requestUtils.createPage( {
			title: 'Bedankt voor je donatie!',
			content:
				'<!-- wp:paragraph --><p>We hebben je donatie goed ontvangen. Dankzij jou kunnen we ons werk blijven doen.</p><!-- /wp:paragraph -->',
			status: 'publish',
		} );

		created.pages.push( thanks.id );

		wpCli(
			'option',
			'update',
			'pronamic_pay_completed_page_id',
			String( thanks.id )
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		for ( const id of created.pages ) {
			await requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/pages/${ id }`,
				params: { force: true },
			} );
		}

		// No REST API for configurations.
		for ( const id of created.gateways ) {
			wpCli( 'post', 'delete', String( id ), '--force' );
		}

		if ( null !== originalSiteTitle ) {
			wpCli( 'option', 'update', 'blogname', originalSiteTitle );
		}

		if ( null === originalCompletedPage ) {
			wpCli( 'option', 'delete', 'pronamic_pay_completed_page_id' );
		} else {
			wpCli(
				'option',
				'update',
				'pronamic_pay_completed_page_id',
				originalCompletedPage
			);
		}

		// The submission, payment and subscription of the donation.
		const ids = wpCli(
			'post',
			'list',
			'--post_type=pronamic_submission,pronamic_payment,pronamic_pay_subscr',
			'--post_status=any',
			'--format=ids'
		)
			.split( ' ' )
			.filter( ( id ) => Number( id ) > lastPostId );

		if ( ids.length > 0 ) {
			wpCli( 'post', 'delete', ...ids, '--force' );
		}

		await restorePlugins( requestUtils, deactivatedPlugins );
	} );

	test( 'plugin', async ( { admin, page } ) => {
		await preparePage( page );

		const director = new Director( page, 'plugin' );

		await admin.visitAdminPage( 'index.php' );

		await director.step( 'plugin-menu', async () => {
			await director.click( page.locator( '#menu-plugins > a' ) );
			await director.click(
				page.locator( '#menu-plugins a[href="plugin-install.php"]' )
			);
		} );

		const card = page.locator(
			'.plugin-card-pronamic-pay-doneren-met-mollie'
		);

		await director.step( 'plugin-search', async () => {
			await director.type(
				page.locator( '#search-plugins' ),
				'Doneren met Mollie'
			);

			await card.waitFor( { timeout: 30000 } );
		} );

		await director.step( 'plugin-install', async () => {
			await director.highlight( card, 3500 );
			await director.hover(
				card
					.locator(
						'.plugin-action-buttons a, .plugin-action-buttons button'
					)
					.first()
			);
		} );

		await director.finish();
	} );

	test( 'mollie', async ( { admin, page } ) => {
		await preparePage( page );

		const director = new Director( page, 'mollie' );

		await admin.visitAdminPage( 'index.php' );

		await director.step( 'mollie-menu', async () => {
			await director.click(
				page.locator( '#toplevel_page_pronamic_ideal > a' )
			);
			await director.click(
				page.locator(
					'#toplevel_page_pronamic_ideal a[href="edit.php?post_type=pronamic_gateway"]'
				)
			);
		} );

		await director.step( 'mollie-add', async () => {
			await director.click( page.locator( '.page-title-action' ) );
		} );

		await director.step( 'mollie-title', async () => {
			await director.type( page.locator( '#title' ), 'Mollie' );
			await director.select(
				page.locator( '#pronamic_gateway_id' ),
				'mollie'
			);
		} );

		await director.step( 'mollie-key', async () => {
			await director.highlight(
				page.locator( '[name="_pronamic_gateway_mollie_api_key"]' )
			);
			await director.paste(
				page.locator( '[name="_pronamic_gateway_mollie_api_key"]' ),
				mollieApiKey ?? fakeApiKey
			);
		} );

		await director.step( 'mollie-publish', async () => {
			await director.click( page.locator( '#publish' ) );
			await page.waitForURL( /post\.php\?post=\d+&action=edit/ );
		} );

		created.gateways.push(
			Number( new URL( page.url() ).searchParams.get( 'post' ) )
		);

		await director.finish();
	} );

	test( 'form', async ( { admin, editor, page } ) => {
		await preparePage( page, adminCss + hideAdminBarCss );

		const director = new Director( page, 'form' );

		await admin.createNewPost( { postType: 'page', fullscreenMode: true } );

		await editor.setPreferences( 'core', { fixedToolbar: false } );

		// The starter patterns modal of new pages, it opens with a delay.
		const modal = page.locator( '.editor-start-page-options__modal' );

		const hasModal = await modal
			.waitFor( { timeout: 5000 } )
			.then( () => true )
			.catch( () => false );

		if ( hasModal ) {
			await page.keyboard.press( 'Escape' );
			await modal.waitFor( { state: 'hidden' } );
		}

		await director.step( 'form-new', async () => {
			await director.type(
				editor.canvas.locator( '.editor-post-title__input' ),
				'Doneren'
			);
		} );

		const inserter = page.locator(
			'.block-editor-inserter__main-area, .block-editor-inserter__menu'
		);

		await director.step( 'form-inserter', async () => {
			await director.click(
				page.locator( '.editor-document-tools__inserter-toggle' )
			);
			await director.click(
				inserter.getByRole( 'tab', { name: 'Patronen' } )
			);
			await director.click(
				inserter.getByRole( 'tab', { name: 'Pronamic formulieren' } )
			);
		} );

		await director.step( 'form-pattern', async () => {
			const pattern = page.getByRole( 'option', {
				name: 'Donatieformulier',
			} );

			await expect( pattern ).toBeVisible();

			await director.click( pattern );

			await director.click(
				page.locator( '.editor-document-tools__inserter-toggle' )
			);
		} );

		await director.step( 'form-edit', async () => {
			await director.click(
				editor.canvas
					.locator( '.wp-block-pronamic-form-radio-field' )
					.first()
			);
		} );

		await director.step( 'form-publish', async () => {
			await director.click(
				page.locator( '.editor-post-publish-panel__toggle' )
			);
			await director.click(
				page.locator(
					'.editor-post-publish-panel .editor-post-publish-button'
				)
			);
			await page.locator( '.post-publish-panel__postpublish' ).waitFor();
		} );

		donatePage = await page.evaluate( () => ( {
			id: window.wp.data.select( 'core/editor' ).getCurrentPostId(),
			link: window.wp.data.select( 'core/editor' ).getPermalink(),
		} ) );

		created.pages.push( donatePage.id );

		await director.finish();
	} );

	test.describe( 'Frontend', () => {
		// Logged out, so without the admin bar.
		test.use( { storageState: { cookies: [], origins: [] } } );

		test( 'donate', async ( { page, requestUtils } ) => {
			await preparePage( page, '' );

			const director = new Director( page, 'donate' );

			// Recording this scene alone, without the `form` scene.
			if ( null === donatePage ) {
				const item = await requestUtils.createPage( {
					title: 'Doneren',
					content:
						'<!-- wp:pattern {"slug":"pronamic/donation-form"} /-->',
					status: 'publish',
				} );

				donatePage = { id: item.id, link: item.link };

				created.pages.push( item.id );
			}

			await page.goto( donatePage.link );

			const field = ( label ) =>
				page
					.locator( '.wp-block-pronamic-form-field' )
					.filter( {
						has: page.locator( 'label', { hasText: label } ),
					} )
					.locator( 'input, textarea' )
					.first();

			await director.step( 'donate-intro', async () => {
				await director.hover( page.locator( 'h1' ).first() );
			} );

			await director.step( 'donate-details', async () => {
				await director.type( field( 'Naam' ), 'Sanne de Vries' );
				await director.type(
					field( 'E-mailadres' ),
					'sanne@example.com'
				);
			} );

			await director.step( 'donate-frequency', async () => {
				await director.click(
					page
						.locator( 'input[value="monthly"]' )
						.locator( '..' )
						.locator( 'label' )
				);
			} );

			await director.step( 'donate-amount', async () => {
				await director.type( field( 'Bedrag' ), '25' );
				await director.click(
					page
						.locator( 'input[value="ideal"]' )
						.locator( '..' )
						.locator( 'label' )
				);
			} );

			const submit = page.locator(
				'.wp-block-pronamic-form button[type="submit"]'
			);

			if ( null === mollieApiKey ) {
				await director.step( 'donate-submit', async () => {
					await director.hover( submit );
				} );

				await director.finish();

				return;
			}

			await director.step( 'donate-submit', async () => {
				await director.click( submit );
				await page.waitForURL( /mollie\.com/, { timeout: 30000 } );
			} );

			// The Mollie test checkout: choose a bank and the status "Paid".
			await director.step( 'donate-mollie', async () => {
				const bank = page.getByText( 'ING', { exact: true } );
				const paid = page.getByRole( 'radio', { name: 'Betaald' } );

				// The checkout loads in steps, wait until it reacts to clicks.
				await bank.waitFor();
				await page.waitForLoadState( 'networkidle' );
				await page.waitForTimeout( 800 );

				await director.click( bank );

				// Click again when the first click came too early.
				if (
					! ( await paid
						.waitFor( { timeout: 5000 } )
						.then( () => true )
						.catch( () => false ) )
				) {
					await bank.click();
				}

				// The page slides in, wait until it stands still.
				await paid.waitFor();
				await page.waitForTimeout( 1200 );

				await director.click(
					page.locator( 'label' ).filter( { has: paid } ).first()
				);

				await expect( paid ).toBeChecked();
				await director.click(
					page.getByRole( 'button', { name: /Ga verder/ } )
				);
			} );

			await director.step( 'donate-return', async () => {
				await page.waitForURL(
					( url ) => url.origin === new URL( donatePage.link ).origin,
					{ timeout: 30000 }
				);
			} );

			await director.finish();
		} );
	} );

	test( 'payments', async ( { admin, page } ) => {
		const director = new Director( page, 'payments' );

		if ( null === mollieApiKey ) {
			director.skip( 'No MOLLIE_TEST_API_KEY.' );

			return;
		}

		await preparePage( page );

		await admin.visitAdminPage( 'index.php' );

		await director.step( 'payments', async () => {
			await director.click(
				page.locator( '#toplevel_page_pronamic_ideal > a' )
			);
			await director.click(
				page.locator(
					'#toplevel_page_pronamic_ideal a[href="edit.php?post_type=pronamic_payment"]'
				)
			);
		} );

		await director.finish();
	} );
} );
