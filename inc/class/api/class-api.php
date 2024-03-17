<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

use J7\PowerPartner\Utils;

final class Api {

	const AJAXNONCE_API_ENDPOINT = 'ajaxnonce';

	function __construct() {
		require_once __DIR__ . '/class-fetch.php';
		require_once __DIR__ . '/class-connect.php';

		foreach ( array( self::AJAXNONCE_API_ENDPOINT ) as $action ) {
			\add_action( 'rest_api_init', array( $this, "register_{$action}_api" ) );
		}
	}

	public function ajaxnonce_callback( $request ) {
		$nonce = \wp_create_nonce( Utils::KEBAB );
		return \rest_ensure_response( $nonce );
	}

	public function register_ajaxnonce_api() {
		$endpoint = self::AJAXNONCE_API_ENDPOINT;
		\register_rest_route(
			Utils::KEBAB,
			"{$endpoint}",
			array(
				'methods'  => 'GET',
				'callback' => array( $this, "{$endpoint}_callback" ),
			)
		);
	}
}

new Api();
