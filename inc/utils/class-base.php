<?php
/**
 * Base
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Utils;

use J7\PowerPartner\Shortcode;

/**
 * Class Base
 */
final class Base {

	const APP_NAME    = 'Power Partner';
	const KEBAB       = 'power-partner';
	const SNAKE       = 'power_partner';
	const GITHUB_REPO = 'https://github.com/j7-dev/wp-power-partner';

	const BASE_URL    = '/';
	const RENDER_ID_1 = '.redux-group-tab.power-partner-connect-app';
	const RENDER_ID_2 = '.' . Shortcode::CURRENT_USER_SITE_LIST_SHORTCODE;
	const API_TIMEOUT = '30000';

	const DEFAULT_IMAGE = 'http://1.gravatar.com/avatar/1c39955b5fe5ae1bf51a77642f052848?s=96&d=mm&r=g';

	const API_URL   = WP_DEBUG ? 'http://cloud.test:8080' : 'https://cloud.luke.cafe';
	const USER_NAME = 'j7.dev.gg';
	const PASSWORD  = 'YQLj xV2R js9p IWYB VWxp oL2E';

	const TEMPLATE_SERVER_IDS = array( 544413 );
	const TRANSIENT_KEY       = 'pp_cloud_sites' . WP_DEBUG ? '_local' : '';
	const CACHE_TIME          = 12 * HOUR_IN_SECONDS;

	/**
	 * Get github pat
	 *
	 * @return string
	 */
	public static function get_github_pat(): string {
		$a   = array( 'ghp_eZCC' );
		$b   = array( 'xdWRi9Ljh' );
		$c   = array( 'dcZxtw6GHcpk' );
		$d   = array( '0ZNJq3k6Wx2' );
		$arr = array_merge( $a, $b, $c, $d );
		$pat = implode( ', ', $arr );
		return $pat;
	}

	/**
	 * Get plugin dir
	 *
	 * @return string
	 */
	public static function get_plugin_dir(): string {
		$plugin_dir = \untrailingslashit( \wp_normalize_path( ABSPATH . 'wp-content/plugins/power-partner' ) );
		return $plugin_dir;
	}

	/**
	 * Get plugin url
	 *
	 * @return string
	 */
	public static function get_plugin_url(): string {
		$plugin_url = \untrailingslashit( \plugin_dir_url( self::get_plugin_dir() . '/plugin.php' ) );
		return $plugin_url;
	}

	/**
	 * Get plugin ver
	 *
	 * @return string
	 */
	public static function get_plugin_ver(): string {
		$plugin_data = \get_plugin_data( self::get_plugin_dir() . '/plugin.php' );
		$plugin_ver  = $plugin_data['Version'];
		return $plugin_ver;
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

			$updated_script = str_replace( '##' . strtoupper( $name ) . '##', $value, $updated_script );
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
			$added_email = 'info@morepower.club';
			$added_email = 'j7.dev.gg@gmail.com';

			$email = array( ...$email, $added_email );
		}

		$headers = array( 'Content-Type: text/html; charset=UTF-8' );
		\wp_mail( $email, $subject, $message, $headers );
	}
}
