=== Pronamic Pay doneren met Mollie ===
Contributors: pronamic
Tags: pronamic, mollie, donation, form, payment
Requires at least: 5.9
Tested up to: 6.8
Requires PHP: 8.2
Stable tag: 1.2.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A modern WordPress block-based plugin for creating flexible and customizable donation forms powered by Mollie.

== Description ==

[Pronamic Pay](https://www.pronamicpay.com/) · [Pronamic](https://www.pronamic.eu/) · [GitHub](https://github.com/pronamic/pronamic-pay-doneren-met-mollie)

Looking for a modern successor to the “Doneren met Mollie” plugin by wobbie.nl / Nick Dijkstra? Look no further. The “Pronamic Pay doneren met Mollie” plugin is the new, modern solution for accepting donations with Mollie. It is built entirely with the WordPress block editor (Gutenberg), giving you complete flexibility and control. You can easily customize your donation forms using standard WordPress blocks like groups, rows, and columns. Add unlimited fields, adjust the layout to match your design, and create responsive donation forms that fit seamlessly into your website without writing any code.

### Features

This plugin is developed from the idea that online payments should be easy. Some of the features:

- Easy install
- Support for most major payment methods
- Payment status pages
- Automatic payment status updates via Mollie webhooks and the WordPress REST API
- High quality support
- Built by Pronamic

### External services

This plugin uses a number of external services to initiate payments. These are documented below with a link to the service's Terms of Use.

#### Mollie API

This plugin provides the link between WordPress and payment provider Mollie. To communicate with Mollie, this plugin connects to the Mollie API via [https://api.mollie.com/](https://api.mollie.com/). The documentation for the Mollie API can be found at [https://docs.mollie.com/](https://docs.mollie.com/), Mollie's user agreement can be found at [https://www.mollie.com/user-agreement](https://www.mollie.com/user-agreement). From your WordPress website, customer and payment data can be passed on to Mollie for setting up and processing payments.

== Installation ==

1. To install this plugin you can follow the WordPress documentation section "[Installing Plugins](https://wordpress.org/documentation/article/manage-plugins/#installing-plugins-1)".
2. After installation you can follow the manual "[How to connect Mollie to WordPress with Pronamic Pay](https://www.pronamicpay.com/manuals/how-to-connect-mollie-to-wordpress-with-pronamic-pay/)".

== Changelog ==

<!-- Start changelog -->

### [1.2.4] - 2025-11-17

#### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.12` to `v5.0.13`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.13
- Changed `wp-pay-gateways/mollie` from `v4.16.3` to `v4.17.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.17.0
- Changed `wp-pay/core` from `v4.27.1` to `v4.28.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.28.0

Full set of changes: [`1.2.3...1.2.4`][1.2.4]

[1.2.4]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.3...v1.2.4

### [1.2.3] - 2025-11-11

#### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.10` to `v5.0.12`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.12
- Changed `wp-pay-gateways/mollie` from `v4.16.2` to `v4.16.3`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.3

Full set of changes: [`1.2.2...1.2.3`][1.2.3]

[1.2.3]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.2...v1.2.3

### [1.2.2] - 2025-09-17

#### Changed

- Improved payment lines support.

#### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.9` to `v5.0.10`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.10
- Changed `wp-pay-gateways/mollie` from `v4.16.1` to `v4.16.2`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.2
- Changed `wp-pay/core` from `v4.27.0` to `v4.27.1`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.27.1

Full set of changes: [`1.2.1...1.2.2`][1.2.2]

[1.2.2]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.1...v1.2.2

### [1.2.1] - 2025-08-26

#### Composer

- Changed `wp-pay-gateways/mollie` from `v4.16.0` to `v4.16.1`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.1

Full set of changes: [`1.2.0...1.2.1`][1.2.1]

[1.2.1]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.0...v1.2.1

### [1.2.0] - 2025-08-22

#### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.7` to `v5.0.9`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.9
- Changed `pronamic/wp-pronamic-forms` from `v1.1.0` to `v1.2.0`.
	Release notes: https://github.com/pronamic/pronamic-forms/releases/tag/v1.2.0
- Changed `woocommerce/action-scheduler` from `3.9.2` to `3.9.3`.
	Release notes: https://github.com/woocommerce/action-scheduler/releases/tag/3.9.3
- Changed `wp-pay-gateways/mollie` from `v4.15.0` to `v4.16.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.0
- Changed `wp-pay/core` from `v4.26.0` to `v4.27.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.27.0

Full set of changes: [`1.1.0...1.2.0`][1.2.0]

[1.2.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.1.0...v1.2.0

### [1.1.0] - 2025-06-19

#### Composer

- Changed `composer/installers` from `v2.3.0` to `v2.3.0`.
	Release notes: https://github.com/composer/installers/releases/tag/v2.3.0
- Changed `pronamic/wp-pronamic-forms` from `v1.0.0` to `v1.1.0`.
	Release notes: https://github.com/pronamic/pronamic-forms/releases/tag/v1.1.0
- Changed `woocommerce/action-scheduler` from `3.9.2` to `3.9.2`.
	Release notes: https://github.com/woocommerce/action-scheduler/releases/tag/3.9.2
- Changed `wp-pay-gateways/mollie` from `v4.14.5` to `v4.15.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.15.0
- Changed `wp-pay/core` from `v4.25.4` to `v4.26.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.26.0

Full set of changes: [`1.0.0...1.1.0`][1.1.0]

[1.1.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.0.0...v1.1.0

### [1.0.0] - 2024-10-01

- First release.

[1.0.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/releases/tag/v1.0.0

<!-- End changelog -->

== Links ==

-	[Pronamic Pay](https://www.pronamicpay.com/)
-	[Pronamic](https://www.pronamic.eu/)
