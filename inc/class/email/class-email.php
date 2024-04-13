<?php
/**
 * Email
 */

declare(strict_types=1);

namespace J7\PowerPartner;

use J7\PowerPartner\Utils;

/**
 * Class Email
 */
final class Email {

	const EMAILS_OPTION_NAME = Utils::SNAKE . '_emails';

	/**
	 * Get emails
	 *
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 */
	public static function get_emails( $action_name = '' ): array {
		$emails = \get_option( self::EMAILS_OPTION_NAME, array() );
		if ( empty( $action_name ) ) {
			return $emails;
		}

		$emails = array_filter(
			$emails,
			function ( $email ) use ( $action_name ) {
				return $email['action_name'] === $action_name;
			}
		);
		return $emails;
	}
}
