/**
 * WordPress helpers for the screenshots and the video.
 *
 * Both run Playwright against `wp-env` with the fixtures of
 * `@wordpress/e2e-test-utils-playwright`.
 */

/*
 * The build, not the `-dev` source: only `composer run build` compiles the
 * Pronamic Forms blocks.
 */
const plugin =
	'pronamic-pay-doneren-met-mollie/pronamic-pay-doneren-met-mollie';

// Plugins that stay active, the others in `.wp-env.json` clutter the admin.
const keepActive = [
	plugin,
	'solvebeam-quick-login-for-wp-env/solvebeam-quick-login-for-wp-env',
];

/**
 * Activate the plugin and deactivate the others.
 *
 * @param {Object} requestUtils Request utils.
 * @return {Promise<string[]>} The deactivated plugins, for `restorePlugins()`.
 */
async function isolatePlugin( requestUtils ) {
	await requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/plugins/${ plugin }`,
		data: { status: 'active' },
	} );

	const plugins = await requestUtils.rest( {
		path: '/wp/v2/plugins',
		params: { status: 'active' },
	} );

	const deactivated = plugins
		.map( ( item ) => item.plugin.replace( /\.php$/, '' ) )
		.filter( ( item ) => ! keepActive.includes( item ) );

	for ( const item of deactivated ) {
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/plugins/${ item }`,
			data: { status: 'inactive' },
		} );
	}

	return deactivated;
}

/**
 * Activate the plugins that `isolatePlugin()` deactivated.
 *
 * @param {Object}   requestUtils Request utils.
 * @param {string[]} plugins      Plugins.
 * @return {Promise<void>}
 */
async function restorePlugins( requestUtils, plugins ) {
	for ( const item of plugins ) {
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/plugins/${ item }`,
			data: { status: 'active' },
		} );
	}
}

/**
 * Set the admin language of the current user.
 *
 * @param {Object} requestUtils Request utils.
 * @param {string} locale       Locale, empty for the site language.
 * @return {Promise<void>}
 */
async function setUserLocale( requestUtils, locale ) {
	await requestUtils.rest( {
		method: 'POST',
		path: '/wp/v2/users/me',
		data: { locale },
	} );
}

/**
 * Delete a payment gateway configuration.
 *
 * There is no REST API for configurations, so delete it in the admin.
 *
 * @param {Object} admin     Admin utils.
 * @param {Object} page      Page.
 * @param {number} gatewayId Configuration post ID.
 * @return {Promise<void>}
 */
async function deleteGateway( admin, page, gatewayId ) {
	await admin.visitAdminPage( 'post.php', `post=${ gatewayId }&action=edit` );

	await page.locator( '#delete-action a' ).click();

	await admin.visitAdminPage(
		'edit.php',
		'post_status=trash&post_type=pronamic_gateway'
	);

	await page
		.locator( `#post-${ gatewayId } .submitdelete` )
		.dispatchEvent( 'click' );

	await page.waitForURL( /deleted=1/ );
}

/**
 * CSS that hides the admin bar in the fullscreen editor.
 *
 * WordPress 7.1 keeps the admin bar visible in fullscreen mode.
 */
const hideAdminBarCss = `
	#wpadminbar { display: none !important; }
	html.wp-toolbar { padding-top: 0 !important; }
	.interface-interface-skeleton { top: 0 !important; }
`;

/**
 * Open the editor in fullscreen mode.
 *
 * @param {Object}      fixtures        Test fixtures.
 * @param {Object}      fixtures.admin  Admin utils.
 * @param {Object}      fixtures.editor Editor utils.
 * @param {Object}      fixtures.page   Page.
 * @param {number|null} postId          Post ID, `null` for a new post.
 * @param {Object}      corePreferences Editor preferences, e.g. `fixedToolbar`.
 * @return {Promise<void>}
 */
async function openEditor(
	{ admin, editor, page },
	postId,
	corePreferences = {}
) {
	if ( null === postId ) {
		// A new post, not a page, to skip the starter patterns modal.
		await admin.createNewPost( { fullscreenMode: true } );
	} else {
		await admin.editPost( postId );
		await editor.setPreferences( 'core/edit-post', {
			fullscreenMode: true,
		} );
	}

	await editor.setPreferences( 'core', {
		fixedToolbar: false,
		...corePreferences,
	} );

	await page.addStyleTag( { content: hideAdminBarCss } );
}

/**
 * Give fonts and previews a moment to finish rendering.
 *
 * @param {import('@playwright/test').Page} page Page.
 * @return {Promise<void>}
 */
async function settle( page ) {
	await page.evaluate( () => document.fonts.ready );
	await page.waitForTimeout( 1000 );
}

/**
 * Hide admin notices, such as the Pronamic Pay home URL notice.
 *
 * @param {import('@playwright/test').Page} page Page.
 * @return {Promise<void>}
 */
async function hideNotices( page ) {
	await page.addStyleTag( {
		content: '#wpbody-content .notice { display: none !important; }',
	} );
}

module.exports = {
	plugin,
	isolatePlugin,
	restorePlugins,
	setUserLocale,
	deleteGateway,
	hideAdminBarCss,
	openEditor,
	settle,
	hideNotices,
};
