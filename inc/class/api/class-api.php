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
final class Api {


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
			'customer-notification',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'post_customer_notification_callback' ),
				'permission_callback' => array( $this, 'check_ip_permission' ),
			)
		);

		\register_rest_route(
			Plugin::KEBAB,
			'customer-notification',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customer_notification_callback' ),
				'permission_callback' => array( $this, 'check_ip_permission' ),
			)
		);

		\register_rest_route(
			Plugin::KEBAB,
			'manual-site-sync',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'manual_site_sync_callback' ),
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			)
		);

		\register_rest_route(
			Plugin::KEBAB,
			'emails',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'post_emails_callback' ),
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			)
		);

		\register_rest_route(
			Plugin::KEBAB,
			'emails',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_emails_callback' ),
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Post customer notification callback
	 * 發 Email 通知客戶
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function post_customer_notification_callback( $request ) {
		try {
			$body_params = $request->get_json_params() ?? array();
			$customer_id = $body_params['CUSTOMER_ID'];
			$customer    = \get_user_by( 'id', $customer_id );
			if ( ! $customer || empty( $customer_id ) ) {
				return \rest_ensure_response(
					array(
						'status'  => 500,
						'message' => 'missing customer id',
					)
				);
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

			// 取得 site_sync 的 email 模板
			$emails = Email::get_emails( 'site_sync' );

			foreach ( $emails as $email ) {
				// 取得 subject
				$subject = $email['subject'];
				$subject = empty( $subject ) ? Email::DEFAULT_SUBJECT : $subject;

				// 取得 message
				$body = $email['body'];
				$body = empty( $body ) ? Email::DEFAULT_BODY : $body;

				// Replace tokens in email..
				$subject = Base::replace_script_tokens( $subject, $tokens );
				$body    = Base::replace_script_tokens( $body, $tokens );

				$email_headers = array( 'Content-Type: text/html; charset=UTF-8' );
				\wp_mail(
					$customer->user_email,
					$subject,
					$body,
					$email_headers
				);
			}

			return \rest_ensure_response(
				array(
					'status'  => 200,
					'message' => 'post customer notification success',
				)
			);
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $th );
			\J7\WpToolkit\Utils::debug_log( '' . ob_get_clean() );
			return \rest_ensure_response(
				array(
					'status'  => 500,
					'message' => 'post customer notification fail',
				)
			);
		}
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

	/**
	 * Get emails callback
	 *
	 * @return \WP_REST_Response
	 */
	public function get_emails_callback(): \WP_REST_Response {
		$emails = \get_option( Email::EMAILS_OPTION_NAME, array() );

		return new \WP_REST_Response(
			$emails,
			200
		);
	}

	/**
	 * Post emails callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_emails_callback( $request ): \WP_REST_Response {
		$body_params = $request->get_json_params() ?? array();
		$emails      = $body_params['emails'];

		if ( is_array( $emails ) ) {
			\update_option( Email::EMAILS_OPTION_NAME, $emails );
			return new \WP_REST_Response(
				array(
					'status'  => 200,
					'message' => 'save emails success',
				),
				200
			);
		} else {
			return new \WP_REST_Response(
				array(
					'status'  => 500,
					'message' => 'save emails fail, emails is not array',
					'data'    => $emails,
				),
				500
			);
		}
	}

	/**
	 * Manual site sync callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function manual_site_sync_callback( $request ) {
		$body_params   = $request->get_json_params() ?? array();
		$site_id       = $body_params['site_id'];
		$host_position = $body_params['host_position'];
		$partner_id    = \get_option( Plugin::SNAKE . '_partner_id', '0' );
		$customer_id   = \get_current_user_id();
		$customer      = \get_user_by( 'id', $customer_id );

		$response_obj = Fetch::site_sync(
			array(
				'site_url'      => \site_url(),
				'site_id'       => $site_id,
				'host_position' => $host_position,
				'partner_id'    => $partner_id,
				'customer'      => array(
					'id'         => $customer_id,
					'first_name' => $customer->first_name ?? 'admin',
					'last_name'  => $customer->last_name ?? '',
					'username'   => $customer->user_login ?? 'admin',
					'email'      => $customer->user_email ?? '',
					'phone'      => $customer->billing_phone ?? '',
				),
			)
		);

		return new \WP_REST_Response(
			array(
				'status'  => $response_obj->status,
				'message' => $response_obj->message,
				'data'    => $response_obj->data,
			),
			200
		);
	}

	/**
	 * Check IP Permission
	 *
	 * @return bool
	 */
	public function check_ip_permission() {
		// 允許的 ip 列表
		$allowed_ips = array( '61.220.44.7', '61.220.44.10' ); // cloud 站 或 load balancer
		// phpcs:disable
		$request_ip  = $_SERVER['REMOTE_ADDR']; // phpcs:disable 获取发起请求的IP地址
		// phpcs:enable

		ob_start();
		print_r(
			array(
				'allowed_ips'         => $allowed_ips,
				'request_ip'          => $request_ip,
				'check_ip_permission' => in_array( $request_ip, $allowed_ips, true ) ? 'true' : 'false',
			)
		);
		\J7\WpToolkit\Utils::debug_log( '' . ob_get_clean() );

		// 检查发起请求的IP是否在允许的列表中
		return in_array( $request_ip, $allowed_ips, true );
	}
}

new Api();
