<?php
/**
 * Plugin Name: Pronamic Pay doneren met Mollie
 * Plugin URI: https://www.pronamic.eu/plugins/pronamic-pay-doneren-met-mollie/
 * Description: Pronamic Pay plugin with Mollie.
 *
 * Version: 1.3.1
 * Requires at least: 5.9
 * Requires PHP: 8.1
 *
 * Author: Pronamic
 * Author URI: https://www.pronamic.eu/
 *
 * Text Domain: pronamic-pay-doneren-met-mollie
 * Domain Path: /languages/
 *
 * Provides: wp-pay/core
 *
 * License: GPL-2.0-or-later
 *
 * GitHub URI: https://github.com/pronamic/pronamic-pay-doneren-met-mollie
 *
 * @author    Pronamic <info@pronamic.eu>
 * @copyright 2005-2023 Pronamic
 * @license   GPL-3.0-or-later
 * @package   Pronamic\WordPress\Pay
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Autoload.
 */
require_once __DIR__ . '/vendor/autoload_packages.php';

/**
 * Bootstrap.
 */
add_action(
	'plugins_loaded',
	function () {
		load_plugin_textdomain( 'pronamic-pay-doneren-met-mollie', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
	}
);

\Pronamic\WordPress\Pay\Plugin::instance(
	[
		'file'             => __FILE__,
		'action_scheduler' => __DIR__ . '/packages/woocommerce/action-scheduler/action-scheduler.php',
	]
);

add_filter(
	'pronamic_pay_gateways',
	function ( $gateways ) {
		$gateways[] = new \Pronamic\WordPress\Pay\Gateways\Mollie\Integration(
			[
				'manual_url' => \__( 'https://www.pronamicpay.com/en/manuals/how-to-connect-mollie-to-wordpress-with-pronamic-pay/', 'pronamic-pay-doneren-met-mollie' ),
			]
		);

		return $gateways;
	}
);
