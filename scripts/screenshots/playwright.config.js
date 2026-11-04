/**
 * Playwright config for the screenshots.
 *
 * Extends the config of `@wordpress/scripts`, which logs in to WordPress
 * before the screenshots are taken. Requires a running `wp-env`.
 */
process.env.WP_BASE_URL ??= 'http://localhost:8888';

const { defineConfig, devices } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );

module.exports = defineConfig( {
	...baseConfig,
	testDir: '.',
	webServer: undefined,
	projects: [
		{
			name: 'chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport: { width: 1280, height: 800 },
				deviceScaleFactor: 2,
			},
		},
	],
} );
