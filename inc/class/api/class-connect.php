<?php
/**
 * Connect Api
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Plugin;

/**
 * Class Connect
 *
 * @package J7\PowerPartner
 */
final class Connect {

	const USERMETA_IDENTITY      = 'connect_app_identity';
	const PARTNER_ID_OPTION_NAME = Plugin::SNAKE . '_partner_id';

	/**
	 * Connect constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', array( $this, 'register_apis' ) );
	}

	/**
	 * 讓 user_meta `connect_app_identity` 支援 rest api
	 *
	 * @return void
	 */
	public function register_apis(): void {

		/**
		 * 讓 user_meta `connect_app_identity` 支援 rest api
		 */
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

		/**
	 * Register GET partner id API
	 */
		\register_rest_route(
			Plugin::KEBAB,
			'partner-id',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_partner_id_callback' ),
				'permission_callback' => '__return_true',
			)
		);

		/**
	 * Register SET partner id API
	 */
		\register_rest_route(
			Plugin::KEBAB,
			'partner-id',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'set_partner_id_callback' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);

		/**
	 * Register account info API
	 */
		\register_rest_route(
			Plugin::KEBAB,
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
	 * Callback of get_partner_id API
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_partner_id_callback() {

		$partner_id = \get_option( Plugin::SNAKE . '_partner_id', '0' );
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
		$body_params              = $request->get_json_params() ?? array();
		$partner_id               = $body_params['partner_id'] ?? '';
		$encrypted_account_info   = $body_params['encrypted_account_info'] ?? '';
		$allowed_template_options = $body_params['allowed_template_options'] ?? array();

		if ( ! empty( $partner_id ) ) {
			\update_option( self::PARTNER_ID_OPTION_NAME, $partner_id );
			\update_option( Plugin::SNAKE . '_account_info', $encrypted_account_info );
			\set_transient( Fetch::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY, (array) $allowed_template_options, Fetch::ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME );
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
	 * Callback of get_account_info API
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public function get_account_info_callback() {
		$encrypted_account_info = \get_option( Plugin::SNAKE . '_account_info' );

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
