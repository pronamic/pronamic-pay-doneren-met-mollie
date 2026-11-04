<?php
/**
 * Plugin
 *
 * @author    Pronamic <info@pronamic.eu>
 * @copyright 2005-2026 Pronamic
 * @license   GPL-2.0-or-later
 * @package   Pronamic\PronamicPayDonerenMetMollie
 */

declare(strict_types=1);

namespace Pronamic\PronamicPayDonerenMetMollie;

use Pronamic\PronamicForms\Plugin as PronamicFormsPlugin;
use Pronamic\PronamicPayDefaultPaymentMethods\Plugin as DefaultPaymentMethodsPlugin;
use Pronamic\WordPress\Pay\AbstractGatewayIntegration;
use Pronamic\WordPress\Pay\Gateways\Mollie\Integration as MollieIntegration;
use Pronamic\WordPress\Pay\Plugin as PronamicPayPlugin;
use WP_Block_Type;
use WP_Block_Type_Registry;

/**
 * Plugin class
 */
final class Plugin {
	/**
	 * Instance.
	 *
	 * @var self|null
	 */
	private static ?self $instance = null;

	/**
	 * Return instance of this class.
	 *
	 * @param string $plugin_file The plugin file.
	 * @return self A single instance of this class.
	 */
	public static function instance( string $plugin_file ): self {
		self::$instance ??= new self( $plugin_file );

		return self::$instance;
	}

	/**
	 * Construct.
	 *
	 * @param string $plugin_file The plugin file.
	 */
	private function __construct(
		/**
		 * Plugin file.
		 */
		private readonly string $plugin_file
	) {
		\add_action( 'init', $this->set_block_script_translations( ... ), 50 );

		PronamicPayPlugin::instance(
			[
				'file'                 => $this->plugin_file,
				'action_scheduler'     => \dirname( $this->plugin_file ) . '/packages/woocommerce/action-scheduler/action-scheduler.php',
				'pronamic_service_url' => 'https://api.wp-pay.org/wp-json/pronamic-pay/v1/payments',
			]
		);

		\add_filter( 'pronamic_pay_modules', $this->add_modules( ... ) );
		\add_filter( 'pronamic_pay_gateways', $this->add_gateways( ... ) );

		DefaultPaymentMethodsPlugin::instance();

		PronamicFormsPlugin::instance();
	}

	/**
	 * Set script translations for the Pronamic Forms blocks.
	 *
	 * @link https://github.com/pronamic/pronamic-pay-payments-experimental/issues/42
	 * @return void
	 */
	private function set_block_script_translations(): void {
		$block_types = \array_filter(
			WP_Block_Type_Registry::get_instance()->get_all_registered(),
			static fn ( WP_Block_Type $block_type ): bool => 'pronamic-forms' === $block_type->category
		);

		foreach ( $block_types as $block_type ) {
			foreach ( $block_type->editor_script_handles as $handle ) {
				\wp_set_script_translations(
					$handle,
					'pronamic-pay-doneren-met-mollie',
					\dirname( $this->plugin_file ) . '/languages'
				);
			}
		}
	}

	/**
	 * Add modules.
	 *
	 * @param array<string> $modules Modules.
	 * @return array<string>
	 */
	private function add_modules( array $modules ): array {
		$modules[] = 'subscriptions';

		return $modules;
	}

	/**
	 * Add gateways.
	 *
	 * @param array<AbstractGatewayIntegration> $gateways Gateways.
	 * @return array<AbstractGatewayIntegration>
	 */
	private function add_gateways( array $gateways ): array {
		$gateways[] = new MollieIntegration(
			[
				'manual_url' => \__( 'https://www.pronamicpay.com/en/manuals/how-to-connect-mollie-to-wordpress-with-pronamic-pay/', 'pronamic-pay-doneren-met-mollie' ),
			]
		);

		return $gateways;
	}
}
