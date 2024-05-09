<?php
/**
 * Api
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Email\Email;

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
			'customer',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customers' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}


	/**
	 * Get customer notification callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_customers( $request ) { // phpcs:ignore
		$params  = $request?->get_query_params() ?? array();
		$id      = $params['id'] ?? 0;
		$keyword = $params['keyword'] ?? '';

		$args = array(
			'fields'  => array( 'ID', 'display_name' ),
			'include' => array( $id ),
		);

		if ( ! empty( $id ) ) {
			$args      = array(
				'fields'  => array( 'ID', 'display_name' ),
				'include' => array( $id ),
			);
			$customers = \get_users( $args );
			if ( ! empty( $customers ) ) {
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

		if ( ! empty( $keyword ) ) {
			$args      = array(
				'fields' => array( 'ID', 'display_name' ),
				'search' => $keyword,
			);
			$customers = \get_users( $args );
			if ( ! empty( $customers ) ) {
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
}

new User();
