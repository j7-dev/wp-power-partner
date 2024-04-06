<?php
/**
 * Fetch
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Utils;

/**
 * Class Fetch
 */
final class Fetch {

	const ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY = Utils::SNAKE . '_allowed_template_options';
	const ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME    = 30 * 24 * HOUR_IN_SECONDS;
	/**
	 * 發 API 開站
	 *
	 * @param array $props {
	 *   @type string $site_url      網站網址
	 *   @type string $site_id       網站 ID
	 *   @type string $host_position 網站位置
	 *   @type string $partner_id    合作夥伴 ID
	 *   @type array  $customer {
	 *       @type int    $id         顧客 ID
	 *       @type string $first_name 顧客名
	 *       @type string $last_name  顧客姓
	 *       @type string $username   顧客帳號
	 *       @type string $email      顧客 Email
	 *       @type string $phone      顧客電話
	 *   }
	 * }
	 *
	 * @return array|\WP_Error — The response or WP_Error on failure.
	 */
	public static function site_sync( array $props ) {
		$args     = array(
			'body'    => \wp_json_encode( $props ),
			'headers' => array(
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Utils::USER_NAME . ':' . Utils::PASSWORD ), // phpcs:ignore
			),
			'timeout' => 600,
		);
		$response = \wp_remote_post( Utils::API_URL . '/wp-json/power-partner-server/site-sync', $args );

		try {
			$response_obj = json_decode( $response['body'] );
			return $response_obj;
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $response );
			return \rest_ensure_response(
				array(
					'status'  => 500,
					'message' => 'json_decode($response[body]) Error, the $response is ' . ob_get_clean(),
					'data'    => null,
				)
			);
		}
	}

	/**
	 * 取得經銷商允許的模板站
	 * 會先判斷 transient 是否有資料，如果沒有則發 API 取得
	 */
	public static function get_allowed_template_options() {
		$allowed_template_options = \get_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY );

		if ( false === $allowed_template_options ) {
			$allowed_template_options = array();
			$result                   = self::fetch_template_sites_by_user();
			// \J7\WpToolkit\Utils::debug_log( '發API了 ' );
			try {
				$template_sites = $result->data->list;
				foreach ( $template_sites as $site ) {
					$allowed_template_options[ (string) $site->ID ] = $site->post_title;
				}

				\set_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY, (array) $allowed_template_options, self::ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME );
			} catch ( \Throwable $th ) {
				ob_start();
				print_r( $th );
				\J7\WpToolkit\Utils::debug_log( '' . ob_get_clean() );
			}
		} else { // phpcs:ignore
			// \J7\WpToolkit\Utils::debug_log( '沒發API ' );
		}

		return (array) $allowed_template_options;
	}

	/**
	 * 取得合作夥伴的模板站
	 *
	 * @return array|\WP_Error — The response or WP_Error on failure.
	 */
	public static function fetch_template_sites_by_user() {
		$partner_id = \get_option( Connect::PARTNER_ID_OPTION_NAME );

		$args = array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Utils::USER_NAME . ':' . Utils::PASSWORD ), // phpcs:ignore
				'X-Api-Key'     => 'apikey12345',
			),
			'timeout' => 120,
		);

		$response = \wp_remote_get( Utils::API_URL . '/wp-json/power-partner-server/template-sites?user_id=' . $partner_id, $args );

		try {
			$response_obj = json_decode( $response['body'] );
			return $response_obj;
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $response );
			return \rest_ensure_response(
				array(
					'status'  => 500,
					'message' => 'fetch_template_sites_by_user json_decode($response[body]) Error, the $response is ' . ob_get_clean(),
					'data'    => null,
				)
			);
		}
	}
}
