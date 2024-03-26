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
				'Authorization' => 'Basic ' . \base64_encode( Utils::USER_NAME . ':' . Utils::PASSWORD ),
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
}
