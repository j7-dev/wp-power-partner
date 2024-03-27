<?php

/**
 * Api
 */

declare(strict_types=1);

namespace J7\PowerPartner;

use J7\PowerPartner\Utils;

/**
 * Class Api
 */
final class Api {



	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', array( $this, 'register_api_customer_notification' ) );
	}

	/**
	 * Register customer notification API
	 *
	 * @return void
	 */
	public function register_api_customer_notification(): void {
		\register_rest_route(
			Utils::KEBAB,
			'customer-notification',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'post_customer_notification_callback' ),
				// TODO 'permission_callback' => array( $this, 'check_basic_auth' ),
				'permission_callback' => '__return_true',
			)
		);

		\register_rest_route(
			Utils::KEBAB,
			'customer-notification',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customer_notification_callback' ),
				// TODO 'permission_callback' => array( $this, 'check_basic_auth' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Post customer notification callback
	 * 發 Email 通知客戶
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return void
	 */
	public function post_customer_notification_callback( $request ) {

		$body_params = $request->get_json_params() ?? array();
		$customer_id = $body_params['CUSTOMER_ID'];
		$customer    = \get_user_by( 'id', $customer_id );
		if ( ! $customer ) {
			return;
		}

		$tokens                                   = array();
		$tokens['FIRST_NAME']                     = $customer->first_name;
		$tokens['LAST_NAME']                      = $customer->last_name;
		$tokens['NICE_NAME']                      = $customer->user_nicename;
		$tokens['EMAIL']                          = $customer->user_email;
		$tokens['WORDPRESSAPPWCSITESACCOUNTPAGE'] = $body_params['WORDPRESSAPPWCSITESACCOUNTPAGE'];
		$tokens['IPV4']                           = $body_params['IPV4'];
		$tokens['DOMAIN']                         = $body_params['DOMAIN'];
		$tokens['FRONTURL']                       = $body_params['FRONTURL'];
		$tokens['ADMINURL']                       = $body_params['ADMINURL'];
		$tokens['SITEUSERNAME']                   = $body_params['SITEUSERNAME'];
		$tokens['SITEPASSWORD']                   = $body_params['SITEPASSWORD'];

		$power_plugins_settings = \get_option( 'power_plugins_settings' );
		// 取得 subject
		$email_subject = $power_plugins_settings['power_partner_email_subject'];

		// 取得 message
		$email_body = $power_plugins_settings['power_partner_email_body'];

		// Replace tokens in email..
		$email_subject = Utils::replace_script_tokens( $email_subject, $tokens );
		$email_body    = Utils::replace_script_tokens( $email_body, $tokens );

		$email_headers = array( 'Content-Type: text/html; charset=UTF-8' );
		\wp_mail(
			$customer->user_email,
			$email_subject,
			$email_body,
			$email_headers
		);
	}

	/**
	 * Get customer notification callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_customer_notification_callback( $request ) { // phpcs:ignore
		$power_plugins_settings = \get_option( 'power_plugins_settings' );
		return \rest_ensure_response(
			array(
				'status'  => 200,
				'message' => 'get customer notification success',
				'data'    => array(
					'subject' => $power_plugins_settings['power_partner_email_subject'],
					'body'    => $power_plugins_settings['power_partner_email_body'],
				),
			)
		);
	}
}

new Api();
