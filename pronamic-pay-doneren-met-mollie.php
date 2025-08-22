<?php
/**
 * Plugin Name: Pronamic Pay doneren met Mollie
 * Plugin URI: https://www.pronamic.eu/plugins/pronamic-pay-doneren-met-mollie/
 * Description: A modern WordPress block-based plugin for creating flexible and customizable donation forms powered by Mollie.
 *
 * Version: 1.1.0
 * Requires at least: 6.6
 * Requires PHP: 8.2
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
	'init',
	function () {
		/**
		 * Script translations.
		 *
		 * @link https://github.com/pronamic/pronamic-pay-payments-experimental/issues/42
		 */
		$block_types = array_filter(
			WP_Block_Type_Registry::get_instance()->get_all_registered(),
			function ( $block_type ) {
				return isset( $block_type->category ) && 'pronamic-forms' === $block_type->category;
			}
		);

		foreach ( $block_types as $block_type ) {
			foreach ( $block_type->editor_script_handles as $handle ) {
				\wp_set_script_translations(
					$handle,
					'pronamic-pay-doneren-met-mollie',
					__DIR__ . '/languages'
				);
			}
		}
	},
	50
);

\Pronamic\WordPress\Pay\Plugin::instance(
	[
		'file'                 => __FILE__,
		'action_scheduler'     => __DIR__ . '/packages/woocommerce/action-scheduler/action-scheduler.php',
		'pronamic_service_url' => 'https://api.wp-pay.org/wp-json/pronamic-pay/v1/payments',
	]
);

add_filter(
	'pronamic_pay_modules',
	function ( $modules ) {
		$modules[] = 'subscriptions';

		return $modules;
	}
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

$pronamic_forms_plugin = new \Pronamic\PronamicForms\Plugin();

$pronamic_forms_plugin->setup();
