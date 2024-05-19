<?php
/**
 * Api
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Plugin;

/**
 * Class Api
 */
final class User {


	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', array( $this, 'register_apis' ) );
	}

	/**
	 * Register customer notification API
	 *
	 * @return void
	 */
	public function register_apis(): void {
		\register_rest_route(
			Plugin::KEBAB,
			'customers-by-search',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customers_by_search_callback' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		\register_rest_route(
			Plugin::KEBAB,
			'customers',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customers_callback' ),
				'permission_callback' => '__return_true',
			)
		);
	}


	/**
	 * Get customer notification callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_customers_by_search_callback( $request ) { // phpcs:ignore
		$params = $request?->get_query_params() ?? array();
		$id     = $params['id'] ?? '0';
		$search = $params['search'] ?? '';

		$args = array(
			'fields'  => array( 'id', 'display_name' ),
			'include' => explode( ',', $id ),
		);

		if ( ! empty( $id ) ) {
			$args      = array(
				'fields'  => array( 'ID', 'display_name' ),
				'include' => array( $id ),
			);
			$customers = \get_users( $args );
			if ( empty( $customers ) ) {
				return \rest_ensure_response(
					array(
						'status'  => 404,
						'message' => 'customer not found',
					)
				);
			} else {
				return \rest_ensure_response(
					array(
						'status'  => 200,
						'message' => 'get customer success',
						'data'    => $customers,
					)
				);
			}
		}

		if ( ! empty( $search ) ) {
			$args      = array(
				'fields' => array( 'id', 'display_name' ),
				'search' => "*{$search}*",
			);
			$customers = \get_users( $args );
			if ( empty( $customers ) ) {
				return \rest_ensure_response(
					array(
						'status'  => 404,
						'message' => 'customer not found',
					)
				);
			} else {
				return \rest_ensure_response(
					array(
						'status'  => 200,
						'message' => 'get customer success',
						'data'    => $customers,
					)
				);
			}
		}
	}

	/**
	 * Get customers callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_customers_callback( $request ): \WP_REST_Response {

		$params   = $request?->get_query_params() ?? array();
		$user_ids = $params['user_ids'] ?? array();

		if ( empty( $user_ids ) ) {
			return new \WP_REST_Response(
				array(
					'status'  => 500,
					'message' => 'missing user ids',
				),
				500
			);
		}

		$users = \get_users(
			array(
				'include' => $user_ids,
			)
		);

		$formatted_users = array_map(
			function ( $user ) {
				return array(
					'id'           => (string) $user->ID,
					'user_login'   => $user->user_login,
					'user_email'   => $user->user_email,
					'display_name' => $user->display_name,
				);
			},
			$users
		);

		$response = new \WP_REST_Response( $formatted_users );

		// set pagination in header
		$response->header( 'X-WP-Total', count( $formatted_users ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}
}

new User();
