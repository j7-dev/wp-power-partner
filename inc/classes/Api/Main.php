<?php
/**
 * Api
 */

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Email\Utils as EmailUtils;
use J7\PowerPartner\Product\SiteSync;
use J7\PowerPartner\ShopSubscription;
use J7\WpUtils\Classes\WP;

/**
 * Class Api
 */
final class Main {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_apis' ] );
	}

	/**
	 * Register customer notification API
	 *
	 * @return void
	 */
	public function register_apis(): void {
		\register_rest_route(
			Plugin::$kebab,
			'customer-notification',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'post_customer_notification_callback' ],
				'permission_callback' => [ $this, 'check_ip_permission' ],
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'link-site',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'post_link_site_callback' ],
				'permission_callback' => [ $this, 'check_ip_permission' ],
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'manual-site-sync',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'manual_site_sync_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'clear-template-sites-cache',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'clear_template_sites_cache_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'emails',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'post_emails_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'emails',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_emails_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'subscriptions',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_subscriptions_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'change-subscription',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'post_change_subscription_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'apps',
			[
				'methods'             => 'GET',
				'callback'            => [ $this, 'get_apps_callback' ],
				'permission_callback' => '__return_true',
			]
		);

		\register_rest_route(
			Plugin::$kebab,
			'settings',
			[
				'methods'             => 'POST',
				'callback'            => [ $this, 'post_settings_callback' ],
				'permission_callback' => function () {
					return \current_user_can( 'manage_options' );
				},
			]
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
			$body_params = $request->get_json_params() ?? [];
			$customer_id = $body_params['CUSTOMER_ID'] ?? '0';
			$customer    = \get_user_by( 'id', $customer_id );
			if ( ! $customer || empty( $customer_id ) ) {
				return \rest_ensure_response(
					[
						'status'  => 500,
						'message' => 'missing customer id',
					]
				);
			}
			$order_id       = $body_params['REF_ORDER_ID'] ?? '0';
			$order          = \wc_get_order( $order_id );
			$customer_email = $customer->user_email;
			if ( $order ) {
				$customer_email = $order->get_billing_email();
			}

			$tokens                                   = [];
			$tokens['FIRST_NAME']                     = $customer->first_name;
			$tokens['LAST_NAME']                      = $customer->last_name;
			$tokens['NICE_NAME']                      = $customer->user_nicename;
			$tokens['EMAIL']                          = $customer_email;
			$tokens['WORDPRESSAPPWCSITESACCOUNTPAGE'] = $body_params['WORDPRESSAPPWCSITESACCOUNTPAGE'];
			$tokens['IPV4']                           = $body_params['IPV4'];
			$tokens['DOMAIN']                         = $body_params['DOMAIN'];
			$tokens['FRONTURL']                       = $body_params['FRONTURL'];
			$tokens['ADMINURL']                       = $body_params['ADMINURL'];
			$tokens['SITEUSERNAME']                   = $body_params['SITEUSERNAME'];
			$tokens['SITEPASSWORD']                   = $body_params['SITEPASSWORD'];

			// 取得 site_sync 的 email 模板
			$emails = EmailUtils::get_emails( 'site_sync' );

			$success_emails = [];
			$failed_emails  = [];
			foreach ( $emails as $email ) {
				// 取得 subject
				$subject = $email['subject'];
				$subject = empty( $subject ) ? EmailUtils::DEFAULT_SUBJECT : $subject;

				// 取得 message
				$body = $email['body'];
				$body = empty( $body ) ? EmailUtils::DEFAULT_BODY : $body;

				// Replace tokens in email..
				$subject = Base::replace_script_tokens( $subject, $tokens );
				$body    = Base::replace_script_tokens( $body, $tokens );

				$email_headers = [ 'Content-Type: text/html; charset=UTF-8' ];
				$result        = \wp_mail(
					$customer_email,
					$subject,
					\wpautop( $body ),
					$email_headers
				);

				if ( $result ) {
					$success_emails[] = $email['action_name'];
				} else {
					$failed_emails[] = $email['action_name'];
				}
			}

			return \rest_ensure_response(
				[
					'status'  => 200,
					'message' => 'post customer notification success',
					'data'    => [
						'to'             => $customer_email,
						'success_emails' => $success_emails,
						'failed_emails'  => $failed_emails,
					],
				]
			);
		} catch ( \Throwable $th ) {
			return \rest_ensure_response(
				[
					'status'  => 500,
					'message' => 'post customer notification fail: ' . $th->getMessage(),
				]
			);
		}
	}

	/**
	 * Post link site callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function post_link_site_callback( $request ) {
		/**
		 * Body params
		 *
		 * @param string $subscription_id
		 * @param string $site_id
		 */
		$body_params     = $request->get_json_params() ?? [];
		$subscription_id = $body_params['subscription_id'] ?? '';
		$site_id         = $body_params['site_id'] ?? '';
		$linked_site_ids = ShopSubscription::get_linked_site_ids( $subscription_id );
		array_push( $linked_site_ids, $site_id );
		$update_success = ShopSubscription::update_linked_site_ids( $subscription_id, $linked_site_ids );

		if ( $update_success ) {
			return new \WP_REST_Response(
				[
					'status'  => 200,
					'message' => 'post link site success',
					'data'    => 'subscription id: ' . $subscription_id . ' linked site ids: ' . \implode( ',', $linked_site_ids ),
				],
				200
			);
		} else {
			return new \WP_REST_Response(
				[
					'status'  => 500,
					'message' => 'post link site fail',
					'data'    => 'subscription id: ' . $subscription_id . ' linked site ids: ' . \implode( ',', $linked_site_ids ),
				],
				500
			);
		}
	}

	/**
	 * Get subscriptions callback
	 *
	 *  @param \WP_REST_Request $request Request
	 * @return \WP_REST_Response
	 */
	public function get_subscriptions_callback( $request ): \WP_REST_Response {
		$params  = $request->get_query_params() ?? [];
		$user_id = $params['user_id'] ?? 0;

		if ( empty( $user_id ) ) {
			return new \WP_REST_Response(
				[
					'status'  => 500,
					'message' => 'missing user id',
				],
				500
			);
		}

		$subscriptions = \get_posts(
			[
				'numberposts' => -1,
				'post_type'   => 'shop_subscription',
				'post_status' => [ 'wc-on-hold', 'wc-active', 'wc-pending', 'wc-expired' ], // wc-on-hold wc-active
				'meta_key'    => '_customer_user',
				'meta_value'  => $user_id,
			]
		);

		$formatted_subscriptions = array_map(
			function ( $subscription ) {
				return [
					'id'              => (string) $subscription->ID,
					'status'          => $subscription->post_status,
					'post_title'      => $subscription->post_title,
					'post_date'       => $subscription->post_date,
					'linked_site_ids' => array_values( ShopSubscription::get_linked_site_ids( $subscription->ID ) ),
				];
			},
			$subscriptions
		);

		$response = new \WP_REST_Response( $formatted_subscriptions );

		// set pagination in header
		$response->header( 'X-WP-Total', count( $formatted_subscriptions ) );
		$response->header( 'X-WP-TotalPages', 1 );

		return $response;
	}

	/**
	 * Post change subscription callback
	 * 將網站綁定到指定的訂閱(還有上層訂單)上
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function post_change_subscription_callback( $request ) {
		try {
			$body_params     = $request->get_json_params() ?? [];
			$subscription_id = $body_params['subscription_id'] ?? '';
			$site_id         = $body_params['site_id'] ?? '';
			$linked_site_ids = $body_params['linked_site_ids'] ?? [];
			$subscription    = \wcs_get_subscription( $subscription_id );
			if ( ! $subscription || empty( $subscription_id || empty( $site_id ) ) ) {
				return \rest_ensure_response(
					[
						'status'  => 500,
						'message' => 'missing subscription id or site id',
					]
				);
			}

			$parent_order = $subscription->get_parent();
			if ( ! $parent_order ) {
				return \rest_ensure_response(
					[
						'status'  => 500,
						'message' => 'subscription has no parent order',
					]
				);
			}

			if ( ! is_array( $linked_site_ids ) ) {
				return \rest_ensure_response(
					[
						'status'  => 500,
						'message' => 'linked_site_ids is not array',
					]
				);
			}

			$is_success = ShopSubscription::change_linked_site_ids( $subscription_id, $linked_site_ids );

			if ( $is_success ) {
				return \rest_ensure_response(
					[
						'status'  => 200,
						'message' => 'post change subscription success, subscription id: ' . $subscription_id . ' linked site ids: ' . \implode( ',', $linked_site_ids ),
					]
				);
			} else {
				return \rest_ensure_response(
					[
						'status'  => 500,
						'message' => 'post change subscription fail',
					]
				);
			}
		} catch ( \Throwable $th ) {

			return \rest_ensure_response(
				[
					'status'  => 500,
					'message' => 'post change subscription fail: ' . $th->getMessage(),
				]
			);
		}
	}

	/**
	 * Get apps callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function get_apps_callback( $request ): \WP_REST_Response {
		$params  = $request->get_query_params() ?? [];
		$app_ids = $params['app_ids'] ?? [];

		$apps = [];

		foreach ( $app_ids as $app_id ) {
			$args = [
				'post_type'      => ShopSubscription::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => 'any',
				'fields'         => 'ids',
				'meta_key'       => SiteSync::LINKED_SITE_IDS_META_KEY,
				'meta_value'     => $app_id,
			];

			$subscription_ids = \get_posts( $args );

			$apps[] = [
				'app_id'           => (string) $app_id,
				'subscription_ids' => $subscription_ids,
			];
		}

		return new \WP_REST_Response(
			$apps,
			200
		);
	}


	/**
	 * Get emails callback
	 *
	 * @return \WP_REST_Response
	 */
	public function get_emails_callback(): \WP_REST_Response {
		$power_partner_settings = \get_option( 'power_partner_settings', [] );
		$emails                 = $power_partner_settings['emails'] ?? [];

		return new \WP_REST_Response(
			$emails,
			200
		);
	}

	/**
	 * 儲存 emails callback
	 *
	 * @deprecated
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_emails_callback( $request ): \WP_REST_Response {
		$body_params = $request->get_json_params() ?? [];
		$emails      = $body_params['emails'];

		$power_partner_settings = \get_option( 'power_partner_settings', [] );
		if ( is_array( $emails ) ) {
			$power_partner_settings['emails'] = $emails;
			\update_option( 'power_partner_settings', $power_partner_settings);
			return new \WP_REST_Response(
				[
					'status'  => 200,
					'message' => 'save emails success',
				],
				200
			);
		} else {
			return new \WP_REST_Response(
				[
					'status'  => 500,
					'message' => 'save emails fail, emails is not array',
					'data'    => $emails,
				],
				500
			);
		}
	}


	/**
	 * 更新設定
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response
	 */
	public function post_settings_callback( $request ): \WP_REST_Response {
		$body_params = $request->get_json_params() ?? [];
		$body_params = WP::sanitize_text_field_deep( $body_params, true, [ 'emails' ] );

		\update_option( 'power_partner_settings', $body_params );

		return new \WP_REST_Response(
			[
				'status'  => 200,
				'message' => 'update settings success',
				'data'    => $body_params,
			],
			200
		);
	}

	/**
	 * Manual site sync callback
	 * 手動開站
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function manual_site_sync_callback( $request ) {
		$body_params   = $request->get_json_params() ?? [];
		$site_id       = $body_params['site_id'];
		$host_position = $body_params['host_position'];
		$partner_id    = \get_option( Plugin::$snake . '_partner_id', '0' );
		$customer_id   = \get_current_user_id();
		$customer      = \get_user_by( 'id', $customer_id );

		$response_obj = Fetch::site_sync(
			[
				'site_url'      => \site_url(),
				'site_id'       => $site_id,
				'host_position' => $host_position,
				'partner_id'    => $partner_id,
				'customer'      => [
					'id'         => $customer_id,
					'first_name' => $customer->first_name ?? 'admin',
					'last_name'  => $customer->last_name ?? '',
					'username'   => $customer->user_login ?? 'admin',
					'email'      => $customer->user_email ?? '',
					'phone'      => $customer->billing_phone ?? '',
				],
			]
		);

		return new \WP_REST_Response(
			[
				'status'  => $response_obj->status,
				'message' => $response_obj->message,
				'data'    => $response_obj->data,
			],
			200
		);
	}

	/**
	 * Clear template sites cache callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function clear_template_sites_cache_callback( $request ) {

		\delete_transient( Fetch::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY );

		return new \WP_REST_Response(
			[
				'status'  => 200,
				'message' => 'clear template sites cache success',
			],
			200
		);
	}

	/**
	 * Check IP Permission
	 *
	 * @return bool
	 */
	public function check_ip_permission() {
		// 允許的 IP 範圍起始和結束 IP
		$start_ip = '61.220.44.0';
		$end_ip   = '61.220.44.10';

		// 將起始和結束 IP 轉換為長整型
		$start_ip_long = sprintf( '%u', ip2long( $start_ip ) );
		$end_ip_long   = sprintf( '%u', ip2long( $end_ip ) );

    // phpcs:disable
    $request_ip_long = sprintf("%u", ip2long($_SERVER['REMOTE_ADDR']));
    // phpcs:enable

		// 檢查發起請求的 IP 是否在允許的範圍內
		return ( $request_ip_long >= $start_ip_long && $request_ip_long <= $end_ip_long );
	}
}
