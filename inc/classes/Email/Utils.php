<?php
/**
 * Email
 */

declare(strict_types=1);

namespace J7\PowerPartner\Email;

use J7\PowerPartner\Plugin;

/**
 * Class Email
 */
abstract class Utils {
	const DEFAULT_SUBJECT = '這裡填你的信件主旨 ##FIRST_NAME##';
	const DEFAULT_BODY    = Plugin::DEFAULT_EMAIL_BODY;

	const SITE_SYNC_ACTION_NAME               = 'site_sync';
	const SUBSCRIPTION_FAILED_ACTION_NAME     = 'subscription_failed';
	const SUBSCRIPTION_SUCCESS_ACTION_NAME    = 'subscription_success';
	const LAST_ORDER_DATE_CREATED_ACTION_NAME = 'last_order_date_created';
	const DATE_CREATED_ACTION_NAME            = 'date_created';
	const TRIAL_END_ACTION_NAME               = 'trial_end';
	const NEXT_PAYMENT_ACTION_NAME            = 'next_payment';
	const END_ACTION_NAME                     = 'end';
	const END_OF_PREPAID_TERM_ACTION_NAME     = 'end_of_prepaid_term';




	/**
	 * Get emails
	 * 預設只拿 enabled 的 email
	 *
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array
	 */
	public static function get_emails( string $action_name = '' ): array {
		$power_partner_settings = \get_option( 'power_partner_settings', [] );
		$emails                 = $power_partner_settings['emails'] ?? [];

		// 預設只拿 enabled 的 email
		$emails = array_filter(
			$emails,
			function ( $email ) {
				return $email['enabled'] === true || $email['enabled'] == '1';
			}
		);
		if ( empty( $action_name ) ) {
			return $emails;
		}

		$emails = array_filter(
			$emails,
			function ( $email ) use ( $action_name ) {
				return ( $email['action_name'] === $action_name );
			}
		);
		return $emails;
	}
}
