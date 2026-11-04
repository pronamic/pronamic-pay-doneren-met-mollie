/**
 * Playwright config for the video recording.
 *
 * Extends the config of `@wordpress/scripts`, which logs in to WordPress
 * before the recording. Requires a running `wp-env`.
 */
process.env.WP_BASE_URL ??= 'http://localhost:8888';

const { defineConfig, devices } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config.js' );
const { viewport } = require( './lib' );

module.exports = defineConfig( {
	...baseConfig,
	testDir: '.',
	webServer: undefined,
	// The scenes build on each other: plugin, configuration, form, donation.
	fullyParallel: false,
	workers: 1,
	retries: 0,
	timeout: 5 * 60 * 1000,
	projects: [
		{
			name: 'chromium',
			use: {
				...devices[ 'Desktop Chrome' ],
				viewport,
				deviceScaleFactor: 1,
				video: { mode: 'on', size: viewport },
				locale: 'nl-NL',
			},
		},
	],
} );
