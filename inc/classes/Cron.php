<?php
/**
 * Cron
 *
 * @see WC_Subscription method wp-content\plugins\woocommerce-subscriptions\vendor\woocommerce\subscriptions-core\includes\class-wc-subscription.php
 */

declare(strict_types=1);

namespace J7\PowerPartner;

use J7\PowerPartner\Product\SiteSync;
use J7\PowerPartner\Utils\Base;
use J7\PowerPartner\Email\Utils as EmailUtils;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Fetch;
/**
 * Class Cron
 */
final class Cron {
	use \J7\WpUtils\Traits\SingletonTrait;

	const SYNC_SUBSCRIPTION_META_HOOK_NAME = 'power_partner_sync_subscription_post_meta';
	const SEND_EMAIL_HOOK_NAME             = 'power_partner_send_email';
	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'init', [ $this, 'register_single_event' ] );
		\add_action( self::SEND_EMAIL_HOOK_NAME, [ $this, 'send_email' ] );
		\add_action( self::SEND_EMAIL_HOOK_NAME, [ $this, 'disable_sites' ] );
	}

	/**
	 * Register Single Event
	 *
	 * @return void
	 */
	public function register_single_event(): void {

		// 這邊是一個每日檢查事件
		if ( ! \wp_next_scheduled( self::SEND_EMAIL_HOOK_NAME ) ) {
			$result = \wp_schedule_event( strtotime( '+10 minute' ), 'daily', self::SEND_EMAIL_HOOK_NAME, [], true );
			if ( \is_wp_error( $result ) ) {
				\J7\WpUtils\Classes\WC::log($result->get_error_message(), 'CRON 執行 register_single_event wp_schedule_single_event Error');
			}
		}
	}

	/**
	 * Send email
	 *
	 * @return void
	 */
	public function send_email() {

		$emails = EmailUtils::get_emails();

		$action_names = [ EmailUtils::SUBSCRIPTION_SUCCESS_ACTION_NAME, EmailUtils::SUBSCRIPTION_FAILED_ACTION_NAME, EmailUtils::LAST_ORDER_DATE_CREATED_ACTION_NAME, EmailUtils::DATE_CREATED_ACTION_NAME, EmailUtils::TRIAL_END_ACTION_NAME, EmailUtils::NEXT_PAYMENT_ACTION_NAME, EmailUtils::END_ACTION_NAME, EmailUtils::END_OF_PREPAID_TERM_ACTION_NAME ];

		$next_payment_action_names = [ EmailUtils::SUBSCRIPTION_SUCCESS_ACTION_NAME, EmailUtils::SUBSCRIPTION_FAILED_ACTION_NAME ];

		$admin_email = \get_option('admin_email');
		$headers     = [];
		$headers[]   = 'Content-Type: text/html; charset=UTF-8';
		$headers[]   = "Bcc: {$admin_email}";

		// 每個動作依序進行
		foreach ( $action_names as $action_name ) {

			// 取得當前動作 的 email 模板
			$action_emails = array_filter(
				$emails,
				function ( $email ) use ( $action_name ) {
					return $email['action_name'] === $action_name;
				}
			);

			// 每個 email 模板依序寄送
			foreach ( $action_emails as $email ) {
				$order_date_arr = self::get_order_date_arr_by_action( $action_name );

				// 將符合動作的訂閱資料遍歷
				foreach ( $order_date_arr as $order_date ) {

					// 發信時機轉換成 timestamp
					$days_in_time = ( (int) $email['days'] ) * 86400;
					// 判斷是 after 還是 before
					$days_in_time = $email['operator'] === 'after' ? $days_in_time : -1 * $days_in_time;
					$body         = $email['body'];
					$subject      = $email['subject'];

					// 因為 subscription_success 和 subscription_failed 都是用 next_payment 這個 key 判斷，其他動作就維持原本
					$time_name = in_array( $action_name, $next_payment_action_names, true ) ? 'next_payment' : $action_name;

					$action_time           = $order_date[ $time_name ] + $days_in_time; // 計算發信時機
					$action_time_add_1_day = $action_time + ( 86400 * 1 ); // 一天後
					$current_time          = time();

					if ( $current_time > $action_time && $current_time < $action_time_add_1_day ) {
						$subject = Base::replace_script_tokens( $subject, $order_date['tokens'] );
						$body    = Base::replace_script_tokens( $body, $order_date['tokens'] );

						\wp_mail(
							$order_date['customer_email'],
							$subject,
							$body,
							$headers,
						);
					}
				}
			}
		}
	}

	/**
	 * Disable sites
	 *
	 * @return void
	 */
	public static function disable_sites() {
		// 取得所有失敗(非啟用)的訂閱
		$failed_statuses = ShopSubscription::$failed_statuses;

		// 加上前綴 wc- 才篩選得出來
		$failed_statuses = array_map(
			function ( $status ) {
				return 'wc-' . $status;
			},
			$failed_statuses
		);

		// ENHANCE 可以限制只抓 LAST_FAILED_TIMESTAMP_META_KEY < 指定時間(N) + 2,3天的訂閱就好
		$args = [
			'post_type'      => ShopSubscription::POST_TYPE,
			'posts_per_page' => -1,
			'post_status'    => $failed_statuses,
			'fields'         => 'ids',
		];

		$subscription_ids = \get_posts( $args );

		foreach ( $subscription_ids as $subscription_id ) {
			$subscription = \wcs_get_subscription( $subscription_id );
			if ( ! ( $subscription instanceof \WC_Subscription ) ) {
				continue;
			}

			$last_failed_timestamp = (int) ( $subscription->get_meta( ShopSubscription::LAST_FAILED_TIMESTAMP_META_KEY, true ) );
			$diff                  = time() - $last_failed_timestamp;
			$diff_in_days          = round( $diff / 86400, 2 ); // 今天與上次失敗的時間差幾天

			// 取得設定中，過 N 天要禁用網站，N 的天數
			$power_partner_settings    = \get_option( 'power_partner_settings', [] );
			$disable_site_after_n_days = (int) ( $power_partner_settings['power_partner_disable_site_after_n_days'] ?? '7' );

			if ( ( $diff_in_days < $disable_site_after_n_days ) ) {
				continue;
			}

			$linked_site_ids = ShopSubscription::get_linked_site_ids( $subscription_id );
			$order_id        = $subscription->get_parent_id();

			// disable 訂單網站
			foreach ( $linked_site_ids as $site_id ) {
				Fetch::disable_site( $site_id, "訂閱失敗已經過了 {$diff_in_days} 天，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}" );

				$subscription->add_order_note( "訂閱失敗已經過了 {$diff_in_days} 天，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}" );
				$subscription->save();
			}
		}
	}

	/**
	 * Get_order_date_arr_by_action
	 * 將符合動作條件的訂閱關鍵資料組合成陣列
	 * 取得指定 action name 的 最新的續訂訂單創建日期
	 * 有 'subscription_failed' | 'subscription_success' | 'site_sync' 這三種
	 * 'site_sync' 是同步寄送，不需要排程
	 *
	 * @param string $action Action
	 * @return array
	 */
	public static function get_order_date_arr_by_action( string $action ): array {

		$arr = [];
		// 用 action 來決定 query 的 post_status
		switch ( $action ) {
			case EmailUtils::SUBSCRIPTION_SUCCESS_ACTION_NAME:
				$post_status = ShopSubscription::$success_statuses;
				break;
			case EmailUtils::SUBSCRIPTION_FAILED_ACTION_NAME:
				$post_status = ShopSubscription::$failed_statuses;
				break;
			default:
				$post_status = ShopSubscription::$all_statuses;
				break;
		}

		// 把對應狀態的所有的 訂閱ID 撈出來
		$subscription_ids = \get_posts(
			[
				'post_type'      => ShopSubscription::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => $post_status,
				'fields'         => 'ids',
				'meta_query'     => array( //phpcs:ignore
					[
						'key'     => ShopSubscription::IS_POWER_PARTNER_SUBSCRIPTION,
						'compare' => 'EXISTS',
					],
				),
			]
		);

		foreach ( $subscription_ids as $subscription_id ) {
			$subscription = new \WC_Subscription( $subscription_id );
			// $date_type 'date_created', 'trial_end', 'next_payment', 'last_order_date_created', 'end' or 'end_of_prepaid_term'
			$date_created            = $subscription->get_time( 'date_created' );
			$trial_end               = $subscription->get_time( 'trial_end' );
			$next_payment            = $subscription->get_time( 'next_payment' );
			$last_order_date_created = $subscription->get_time( 'last_order_date_created' );
			$end                     = $subscription->get_time( 'end' );
			$end_of_prepaid_term     = $subscription->get_time( 'end_of_prepaid_term' );
			$last_order              = $subscription->get_last_order(); // order | order_id
			if ( is_numeric( $last_order ) ) {
				$last_order = \wc_get_order( $last_order );
			}

			if ( ! $last_order ) {
				continue;
			}
			$last_order_id = $last_order->get_id();

			$tokens = array_merge( self::get_order_tokens( $last_order ), self::get_subscription_tokens( $subscription ) );

			// 把符合條件的訂閱組成這種資料
			$arr[] = [
				'order_id'                => (string) $last_order_id,
				'customer_email'          => $last_order->get_billing_email(),
				'date_created'            => $date_created,
				'trial_end'               => $trial_end,
				'last_order_date_created' => $last_order_date_created,
				'next_payment'            => $next_payment,
				'end'                     => $end,
				'end_of_prepaid_term'     => $end_of_prepaid_term,
				'tokens'                  => $tokens,
			];
		}

		return $arr;
	}

	/**
	 * Get order tokens
	 *
	 * @param \WC_Order $order Order
	 * @return array
	 */
	public static function get_order_tokens( \WC_Order $order ): array {
		$customer = $order->get_user();

		$products = [];
		foreach ( $order->get_items() as $item_id => $item ) {
			$product_name = $item->get_name();
			$products[]   = $product_name;
		}
		$products_text = implode( ', ', $products );

		$tokens                         = [];
		$tokens['FIRST_NAME']           = $customer->first_name;
		$tokens['LAST_NAME']            = $customer->last_name;
		$tokens['NICE_NAME']            = $customer->user_nicename;
		$tokens['EMAIL']                = $customer->user_email;
		$tokens['ORDER_ID']             = $order->get_id();
		$tokens['ORDER_ITEMS']          = $products_text;
		$tokens['CHECKOUT_PAYMENT_URL'] = $order->get_checkout_payment_url();
		$tokens['VIEW_ORDER_URL']       = $order->get_view_order_url();
		$tokens['ORDER_STATUS']         = $order->get_status();
		$tokens['ORDER_DATE']           = $order->get_date_created()->format( 'Y-m-d' );

		return $tokens;
	}

	/**
	 * Get subscription tokens
	 *
	 * @param \WC_Subscription $subscription Subscription
	 * @return array
	 */
	public static function get_subscription_tokens( \WC_Subscription $subscription ): array {

		$order = $subscription->get_parent();

		if ( ! $order ) {
			return [];
		}

		$site_responses = $order->get_meta( SiteSync::CREATE_SITE_RESPONSES_META_KEY, true );
		$tokens         = [];
		try {
			$site_responses_arr = \json_decode( $site_responses, true );
			$site_info          = $site_responses_arr['data'] ?? [];
			$tokens['URL']      = $site_info['url'] ?? '';
		} catch ( \Throwable $th ) {
			\J7\WpUtils\Classes\WC::log( $th->getMessage(), 'get_subscription_tokens json_decode failed');
		}

		return $tokens;
	}
}
