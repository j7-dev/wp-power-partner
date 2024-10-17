<?php
/**
 * Fetch
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Utils\Base;
use J7\PowerPartner\Bootstrap;

/**
 * Class Fetch
 */
abstract class Fetch {

	const ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY = 'power_partner_allowed_template_options';
	// phpstan:ignore
	const ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME = 7 * 24 * HOUR_IN_SECONDS;
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
	 * } $props 開站所需的參數
	 *
	 * @return array<string, mixed>|\WP_Error — The response or WP_Error on failure.
	 */
	public static function site_sync( array $props ) {
		$args     = [
			'body'    => \wp_json_encode( $props ),
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Bootstrap::instance()->username . ':' . Bootstrap::instance()->psw ), // phpcs:ignore
			],
			'timeout' => 600,
		];
		$response = \wp_remote_post( Bootstrap::instance()->base_url . '/wp-json/power-partner-server/site-sync', $args );

		try {
			$response_obj = json_decode( $response['body'] );

			\do_action( 'pp_after_site_sync', $response_obj );

			return $response_obj;
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $response );
			return \rest_ensure_response(
				[
					'status'  => 500,
					'message' => 'json_decode($response[body]) Error, the $response is ' . ob_get_clean(),
					'data'    => null,
				]
			);
		}
	}


	/**
	 * 發 API 關站 disable
	 *
	 * @param string $site_id 網站 ID
	 * @param string $reason  停用原因
	 * @return array|\WP_Error — The response or WP_Error on failure.
	 */
	public static function disable_site( string $site_id, string $reason = '停用網站' ) {
		$args     = [
			'body'    => \wp_json_encode(
				[
					'site_id'    => $site_id,
					'partner_id' => \get_option( Connect::PARTNER_ID_OPTION_NAME ),
					'reason'     => $reason,
				]
			),
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Bootstrap::instance()->username . ':' . Bootstrap::instance()->psw ), // phpcs:ignore
			],
			'timeout' => 600,
		];
		$response = \wp_remote_post( Bootstrap::instance()->base_url . '/wp-json/power-partner-server/v2/disable-site', $args );

		try {
			$response_obj = json_decode( $response['body'] );
			return $response_obj;
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $response );
			return \rest_ensure_response(
				[
					'status'  => 500,
					'message' => 'json_decode($response[body]) Error, the $response is ' . ob_get_clean(),
					'data'    => null,
				]
			);
		}
	}

	/**
	 * 取得經銷商允許的模板站
	 * 會先判斷 transient 是否有資料，如果沒有則發 API 取得
	 *
	 * @return array<string, string>
	 */
	public static function get_allowed_template_options(): array {
		$allowed_template_options = \get_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY );

		if ( false === $allowed_template_options ) {
			$allowed_template_options = [];
			$result                   = self::fetch_template_sites_by_user();
			if (\is_wp_error($result)) {
				return [];
			}

			$template_sites = $result?->data?->list;

			if (!$template_sites) {
				return [];
			}

			foreach ( $template_sites as $site ) {
				$allowed_template_options[ (string) $site->ID ] = $site->post_title;
			}

			\set_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY, (array) $allowed_template_options, self::ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME );
		}

		return (array) $allowed_template_options;
	}

	/**
	 * 取得合作夥伴的模板站
	 *
	 * @return array|null|\WP_Error — The response or WP_Error on failure.
	 */
	public static function fetch_template_sites_by_user() {
		$partner_id = \get_option( Connect::PARTNER_ID_OPTION_NAME );
		if ( ! $partner_id ) {
			return null;
		}

		$args = [
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Bootstrap::instance()->username . ':' . Bootstrap::instance()->psw ), // phpcs:ignore
			],
			'timeout' => 120,
		];

		$response = \wp_remote_get( Bootstrap::instance()->base_url . '/wp-json/power-partner-server/template-sites?user_id=' . $partner_id, $args );

		try {
			$response_obj = json_decode( $response['body'] );
			return $response_obj;
		} catch ( \Throwable $th ) {

			return new \WP_Error(
				'fetch_template_sites_by_user_error',
				$th->getMessage(),
				[
					'status' => 500,
				]
			);
		}
	}
}
