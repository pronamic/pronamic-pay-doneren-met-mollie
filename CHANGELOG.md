# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- Start changelog -->

## [1.7.0] - 2026-09-28

### Changed

- Raised the minimum required PHP version from 8.2 to 8.3.
- Tested up to WordPress 7.1.
- Donation form email fields can now pass the donor's email address to the Mollie payment, and payment descriptions now read "Form submission {entry ID}" (via `pronamic/wp-pronamic-forms` `v2.1.0`).
- The default subscription renewal pre-notification period changed from 1 week to 14 days (via `wp-pay/core` `v4.35.0`).

### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.21` to `v5.0.23`.
	Fixes and then reverts applying the root package's `exclude-from-classmap` setting when generating the Jetpack class map.
	Release notes: https://github.com/Automattic/jetpack-autoloader/blob/v5.0.23/CHANGELOG.md
- Changed `pronamic/wp-mollie` from `v1.10.1` to `v2.0.0`.
	Breaking change: the `due_date` property moved from `PaymentRequest` to `BankTransferPaymentRequest`, because Mollie only supports due dates for bank transfer payments.
	Release notes: https://github.com/pronamic/wp-mollie/releases/tag/v2.0.0
- Changed `pronamic/wp-money` from `2.4.5` to `2.5.0`.
	Adds an optional currency argument to `Parser::parse()`, so amounts can be parsed in currencies other than EUR.
	Release notes: https://github.com/pronamic/wp-money/releases/tag/v2.5.0
- Changed `pronamic/wp-pronamic-forms` from `v2.0.1` to `v2.1.0`.
	Adds support for passing the submitter's email address to Pronamic Pay through the `pronamic_payment_customer_email` field reference, and makes payment descriptions translatable.
	Release notes: https://github.com/pronamic/pronamic-forms/releases/tag/v2.1.0
- Changed `woocommerce/action-scheduler` from `4.0.0` to `4.2.0`.
	Fixes a lock that could get permanently stuck, enforces unique action inserts atomically, reduces SQL queries on the admin page and hardens schedule data deserialization.
	Release notes: https://github.com/woocommerce/action-scheduler/releases/tag/4.1.0, https://github.com/woocommerce/action-scheduler/releases/tag/4.2.0
- Changed `wp-pay-gateways/mollie` from `v4.20.0` to `v4.21.0`.
	Uses a bank transfer payment request when setting the Mollie payment due date, and moves to `pronamic/wp-mollie` `^2.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.21.0
- Changed `wp-pay/core` from `v4.34.0` to `v4.35.0`.
	Changes the default subscription renewal pre-notification period to 14 days and fixes a currency mismatch exception with non-EUR payment lines, errors for payments and subscriptions whose post no longer exists, and PHP deprecation notices.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.35.0

Full set of changes: [`1.6.0...1.7.0`][1.7.0]

[1.7.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.6.0...v1.7.0

## [1.6.0] - 2026-08-03

### Added

- Added integration with the Pronamic Pay default payment methods package, centralizing payment method registration via the new `pronamic_pay_register_payment_methods` action.

### Composer

- Added `pronamic/pronamic-pay-default-payment-methods` `v1.1.0`.
	Provides centralized default payment method registration, including new online banking methods for Czechia and Slovakia.
	Release notes: https://github.com/pronamic/pronamic-pay-default-payment-methods/releases/tag/v1.1.0
- Changed `woocommerce/action-scheduler` from `v3.9.3` to `v4.0.0`.
	Major release with breaking changes: unique-action scheduling now considers action arguments and failed actions are automatically purged after three months.
	Release notes: https://github.com/woocommerce/action-scheduler/releases/tag/4.0.0
- Changed `wp-pay-gateways/mollie` from `v4.19.0` to `v4.20.0`.
	Defers Mollie webhook processing with Action Scheduler and fixes timezone handling for due date calculation.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.20.0
- Changed `wp-pay/core` from `v4.32.0` to `v4.34.0`.
	Moves default payment method registration into a dedicated package via the new `pronamic_pay_register_payment_methods` action and allows Action Scheduler `^4.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.34.0

Full set of changes: [`1.5.0...1.6.0`][1.6.0]

[1.6.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.5.0...v1.6.0

## [1.5.0] - 2026-04-02

### Changed

- Updated payment form compatibility to `pronamic/wp-pronamic-forms` `v2.x`.

### Composer

- Changed `pronamic/wp-pronamic-forms` from `v1.2.1` to `v2.0.0`.
	Release notes: https://github.com/pronamic/pronamic-forms/releases/tag/v2.0.0
- Changed `wp-pay/core` from `v4.30.0` to `v4.32.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.32.0

Full set of changes: [`1.4.0...1.5.0`][1.5.0]

[1.5.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.4.0...v1.5.0

## [1.4.0] - 2026-01-27

### Composer

- Changed `pronamic/wp-pronamic-forms` from `v1.2.0` to `v1.2.1`.
	Release notes: https://github.com/pronamic/pronamic-forms/releases/tag/v1.2.1
- Changed `wp-pay-gateways/mollie` from `v4.18.0` to `v4.19.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.19.0
- Changed `wp-pay/core` from `v4.29.0` to `v4.30.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.30.0

Full set of changes: [`1.3.0...1.4.0`][1.4.0]

[1.4.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.3.0...v1.4.0

## [1.3.0] - 2026-01-05

### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.13` to `v5.0.15`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.15
- Changed `wp-pay-gateways/mollie` from `v4.17.0` to `v4.18.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.18.0
- Changed `wp-pay/core` from `v4.28.0` to `v4.29.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.29.0

Full set of changes: [`1.2.4...1.3.0`][1.3.0]

[1.3.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.4...v1.3.0

## [1.2.4] - 2025-11-17

### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.12` to `v5.0.13`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.13
- Changed `wp-pay-gateways/mollie` from `v4.16.3` to `v4.17.0`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.17.0
- Changed `wp-pay/core` from `v4.27.1` to `v4.28.0`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.28.0

Full set of changes: [`1.2.3...1.2.4`][1.2.4]

[1.2.4]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.3...v1.2.4

## [1.2.3] - 2025-11-11

### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.10` to `v5.0.12`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.12
- Changed `wp-pay-gateways/mollie` from `v4.16.2` to `v4.16.3`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.3

Full set of changes: [`1.2.2...1.2.3`][1.2.3]

[1.2.3]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.2...v1.2.3

## [1.2.2] - 2025-09-17

### Changed

- Improved payment lines support.

### Composer

- Changed `automattic/jetpack-autoloader` from `v5.0.9` to `v5.0.10`.
	Release notes: https://github.com/Automattic/jetpack-autoloader/releases/tag/v5.0.10
- Changed `wp-pay-gateways/mollie` from `v4.16.1` to `v4.16.2`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.2
- Changed `wp-pay/core` from `v4.27.0` to `v4.27.1`.
	Release notes: https://github.com/pronamic/wp-pay-core/releases/tag/v4.27.1

Full set of changes: [`1.2.1...1.2.2`][1.2.2]

[1.2.2]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.1...v1.2.2

## [1.2.1] - 2025-08-26

### Composer

- Changed `wp-pay-gateways/mollie` from `v4.16.0` to `v4.16.1`.
	Release notes: https://github.com/pronamic/wp-pronamic-pay-mollie/releases/tag/v4.16.1

Full set of changes: [`1.2.0...1.2.1`][1.2.1]

[1.2.1]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/compare/v1.2.0...v1.2.1

## [1.2.0] - 2025-08-22

### Composer

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

## [1.1.0] - 2025-06-19

### Composer

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

## [1.0.0] - 2024-10-01

- First release.

[1.0.0]: https://github.com/pronamic/pronamic-pay-doneren-met-mollie/releases/tag/v1.0.0

<!-- End changelog -->
