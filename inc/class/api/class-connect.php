<?php
/**
 * Connect Api
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Utils;

/**
 * Class Connect
 *
 * @package J7\PowerPartner
 */
final class Connect {

	const USERMETA_IDENTITY = 'connect_app_identity';
	const OPTION_NAME       = Utils::SNAKE . '_partner_id';

	/**
	 * Connect constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', array( $this, 'register_user_meta_rest_support' ) );
		\add_action( 'rest_api_init', array( $this, 'register_api_partner_id' ) );
		\add_action( 'rest_api_init', array( $this, 'register_api_account_info' ) );
	}

	/**
	 * 讓 user_meta `connect_app_identity` 支援 rest api
	 *
	 * @return void
	 */
	public function register_user_meta_rest_support(): void {
		\register_meta(
			'user',
			self::USERMETA_IDENTITY,
			array(
				'type'              => 'string',
				'single'            => true,
				'show_in_rest'      => true,
				'sanitize_callback' => 'sanitize_text_field',
				'auth_callback'     => function () {
					return \current_user_can( 'edit_users' );
				},
			)
		);
	}

	/**
	 * Register partner id API
	 *
	 * @return void
	 */
	public function register_api_partner_id(): void {
		\register_rest_route(
			Utils::KEBAB,
			'partner-id',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_partner_id_callback' ),
				'permission_callback' => '__return_true',
			)
		);

		\register_rest_route(
			Utils::KEBAB,
			'partner-id',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_partner_id_callback' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Callback of get_partner_id API
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_partner_id_callback() {

		$partner_id = \get_option( Utils::SNAKE . '_partner_id', '0' );
		if ( empty( $partner_id ) ) {
			return \rest_ensure_response(
				array(
					'status'  => 500,
					'message' => 'fail, partner_id is empty',
					'data'    => null,
				)
			);
		} else {
			return \rest_ensure_response(
				array(
					'status'  => 200,
					'message' => 'success',
					'data'    => array(
						'partner_id' => $partner_id,
					),
				)
			);
		}
	}


	/**
	 * Callback of set_partner_id API
	 *
	 * @param \WP_REST_Request $request Request object.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function set_partner_id_callback( $request ) {
		$body_params            = $request->get_json_params() ?? array();
		$partner_id             = $body_params['partner_id'] ?? '';
		$encrypted_account_info = $body_params['encrypted_account_info'] ?? '';
		if ( ! empty( $partner_id ) ) {
			\update_option( self::OPTION_NAME, $partner_id );
			\update_option( Utils::SNAKE . '_account_info', $encrypted_account_info );
			return \rest_ensure_response(
				array(
					'status'  => 200,
					'message' => 'success',
					'data'    => null,
				)
			);
		} else {
			return \rest_ensure_response(
				array(
					'status'  => 100,
					'message' => 'partner_id is empty',
					'data'    => null,
				)
			);
		}
	}

	/**
	 * Register account info API
	 *
	 * @return void
	 */
	public function register_api_account_info(): void {
		\register_rest_route(
			Utils::KEBAB,
			'account-info',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_account_info_callback' ),
				'permission_callback' => '__return_true',
				// 'permission_callback' => function () {
				// return \current_user_can( 'manage_options' );
				// },
			)
		);
	}

	/**
	 * Callback of get_account_info API
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_account_info_callback() {
		$encrypted_account_info = \get_option( Utils::SNAKE . '_account_info' );

		return \rest_ensure_response(
			array(
				'status'  => 200,
				'message' => 'success',
				'data'    => array(
					'encrypted_account_info' => $encrypted_account_info,
				),
			)
		);
	}
}

new Connect();
