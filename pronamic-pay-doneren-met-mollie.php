<?php
/**
 * Pronamic Pay doneren met Mollie
 *
 * @author    Pronamic <info@pronamic.eu>
 * @copyright 2005-2026 Pronamic
 * @license   GPL-2.0-or-later
 * @package   Pronamic\PronamicPayDonerenMetMollie
 *
 * @wordpress-plugin
 * Plugin Name:       Pronamic Pay doneren met Mollie
 * Plugin URI:        https://www.pronamic.eu/plugins/pronamic-pay-doneren-met-mollie/
 * Description:       A modern WordPress block-based plugin for creating flexible and customizable donation forms powered by Mollie.
 * Version:           1.8.0
 * Requires at least: 6.6
 * Requires PHP:      8.3
 * Author:            Pronamic
 * Author URI:        https://www.pronamic.eu/
 * Text Domain:       pronamic-pay-doneren-met-mollie
 * Domain Path:       /languages/
 * Provides:          wp-pay/core
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * GitHub URI:        https://github.com/pronamic/pronamic-pay-doneren-met-mollie
 */

declare(strict_types=1);

namespace Pronamic\PronamicPayDonerenMetMollie;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

( static function (): void {
	$autoload_path = __DIR__ . '/vendor/autoload_packages.php';

	if ( \file_exists( $autoload_path ) ) {
		require_once $autoload_path;
	}

	Plugin::instance( __FILE__ );
} )();
