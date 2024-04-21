<?php
/**
 * Base
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Utils;

use J7\PowerPartner\Shortcode\Shortcode;
use J7\PowerPartner\Plugin;

/**
 * Class Base
 */
abstract class Base {
	const BASE_URL      = '/';
	const APP1_SELECTOR = '.redux-group-tab.power-partner-connect-app';
	const APP2_SELECTOR = '.' . Shortcode::CURRENT_USER_SITE_LIST_SHORTCODE;
	const API_TIMEOUT   = '30000';
	const DEFAULT_IMAGE = 'http://1.gravatar.com/avatar/1c39955b5fe5ae1bf51a77642f052848?s=96&d=mm&r=g';

	const API_URL   = WP_DEBUG ? 'http://cloud.test:8080' : 'https://cloud.luke.cafe';
	const USER_NAME = 'j7.dev.gg';
	const PASSWORD  = 'YQLj xV2R js9p IWYB VWxp oL2E';

	const TEMPLATE_SERVER_IDS = array( 544413 );
	const TRANSIENT_KEY       = 'pp_cloud_sites' . WP_DEBUG ? '_local' : '';
	const CACHE_TIME          = 12 * HOUR_IN_SECONDS;


	/**
	 * Is HPOS enabled
	 *
	 * @return bool
	 */
	public static function is_hpos_enabled(): bool {
		return class_exists( \Automattic\WooCommerce\Utilities\OrderUtil::class ) && \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled();
	}


	/**
	 * Replaces placeholder tokens in a script.
	 *
	 * A script is usually a server provisioning startup script
	 * Tokens are of the format ##TOKEN## and it is expected that
	 * the 'TOKEN' is uppercase.
	 *
	 * As of Version 4.2.5 of WPCD, this function also handles
	 * replacing similar tokens in EMAIL templates.
	 *
	 * @param string $script The full text of the script contents.
	 * @param array  $tokens Key-value array of tokens to replace.
	 *
	 * @return $string The updated script contents
	 */
	public static function replace_script_tokens( $script, $tokens ) {
		$updated_script = $script;

		foreach ( $tokens as $name => $value ) {
			if ( is_array( $value ) || empty( $value ) ) {
				continue;
			}

			$updated_script = str_replace( '##' . strtoupper( $name ) . '##', (string) $value, $updated_script );
		}

		return $updated_script;
	}

	/**
	 * Mail_to function
	 *
	 * @param string  $subject - email subject
	 * @param string  $message - email message
	 * @param integer $mix - user id | email string | email string[]
	 * @param bool    $send_to_admin - send to admin
	 * @return void
	 */
	public static function mail_to( string $subject, string $message, $mix = 0, $send_to_admin = true ): void {
		$email = array();

		if ( \is_email( $mix ) ) {
			$added_email = $mix;
			$email       = array( ...$email, $added_email );
		}

		if ( \is_array( $mix ) ) {
			$email = array( ...$email, ...$mix );
		}

		if ( is_numeric( $mix ) && $mix > 0 ) {
			$added_email = \get_user_by( 'id', $mix )?->user_email;
			$email       = array( ...$email, $added_email );
		}

		if ( $send_to_admin ) {
			$added_email = array( 'j7.dev.gg@gmail.com', 'luke.cafe.team@gmail.com' );

			$email = array( ...$email, ...$added_email );
		}

		$headers = array( 'Content-Type: text/html; charset=UTF-8' );
		\wp_mail( $email, $subject, $message, $headers );
	}
}
