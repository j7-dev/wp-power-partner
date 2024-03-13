<?php

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Utils;

final class Fetch {




	/**
	 * 發 API 開站
	 *
	 * @param array  $props — The properties of the site.
	 * @param string $props['site_id']
	 * @param string $props['host_position']
	 *
	 * @return array|\WP_Error — The response or WP_Error on failure.
	 */
	public static function site_sync( array $props ): array|\WP_Error {
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
			print_r( $th );
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
