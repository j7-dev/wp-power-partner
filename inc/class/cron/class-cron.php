<?php
/**
 * Cron
 *
 * @see WC_Subscription method wp-content\plugins\woocommerce-subscriptions\vendor\woocommerce\subscriptions-core\includes\class-wc-subscription.php
 */

declare(strict_types=1);

namespace J7\PowerPartner\Cron;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Product\Product;
use J7\PowerPartner\Utils\Base;
use J7\PowerPartner\Email\Email;
use Micropackage\Singleton\Singleton;
use J7\PowerPartner\ShopSubscription\ShopSubscription;
/**
 * Class Cron
 */
final class Cron extends Singleton {

	const SYNC_SUBSCRIPTION_META_HOOK_NAME = Plugin::SNAKE . '_sync_subscription_post_meta';

	const SEND_EMAIL_HOOK_NAME = Plugin::SNAKE . '_send_email';
	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'init', array( $this, 'register_single_event' ) );
		\add_action( self::SYNC_SUBSCRIPTION_META_HOOK_NAME, array( 'J7\PowerPartner\ShopSubscription\ShopSubscription', 'sync_post_meta' ) );
		\add_action( self::SEND_EMAIL_HOOK_NAME, array( $this, 'send_email' ) );
	}

	/**
	 * Register Single Event
	 *
	 * @return void
	 */
	public function register_single_event(): void {

		// 這邊是一個每日檢查事件
		if ( ! \wp_next_scheduled( self::SEND_EMAIL_HOOK_NAME ) ) {
			$result = \wp_schedule_event( strtotime( '+10 minute' ), 'daily', self::SEND_EMAIL_HOOK_NAME, array(), true );
			if ( \is_wp_error( $result ) ) {
				ob_start();
				print_r( $result );
				\J7\WpToolkit\Utils::debug_log( self::SEND_EMAIL_HOOK_NAME . 'wp_schedule_single_event Error: ' . ob_get_clean() );
			}
		}

		// 啟用外掛後 10 分鐘後同步一次訂閱資料就好
		if ( ! \wp_next_scheduled( self::SYNC_SUBSCRIPTION_META_HOOK_NAME ) ) {
			$result = \wp_schedule_single_event( strtotime( '+10 minute' ), self::SYNC_SUBSCRIPTION_META_HOOK_NAME, array(), true );
			if ( \is_wp_error( $result ) ) {
				ob_start();
				print_r( $result );
				\J7\WpToolkit\Utils::debug_log( self::SYNC_SUBSCRIPTION_META_HOOK_NAME . 'wp_schedule_single_event Error: ' . ob_get_clean() );
			}
		}
	}

	/**
	 * Send email
	 *
	 * @return void
	 */
	public function send_email() {

		$emails = Email::get_emails();

		$action_names = array( Email::SUBSCRIPTION_SUCCESS_ACTION_NAME, Email::SUBSCRIPTION_FAILED_ACTION_NAME );

		$next_payment_action_names = array( Email::SUBSCRIPTION_SUCCESS_ACTION_NAME, Email::SUBSCRIPTION_FAILED_ACTION_NAME );

		foreach ( $action_names as $action_name ) {

			// 取得指定 action name 的 email 模板
			$filtered_emails_by_action = array_filter(
				$emails,
				function ( $email ) use ( $action_name ) {
					return $email['action_name'] === $action_name;
				}
			);

			foreach ( $filtered_emails_by_action as $email ) {
				$order_date_arr = self::get_order_date_arr_by_action( $action_name );

				foreach ( $order_date_arr as $order_date ) {
					// 發信時機轉換成 timestamp
					$days_in_time = ( (int) $email['days'] ) * 86400;
					// 判斷是 after 還是 before
					$days_in_time = $email['operator'] === 'after' ? $days_in_time : -1 * $days_in_time;
					$body         = $email['body'];
					$subject      = $email['subject'];

					// 因為 subscription_success 和 subscription_failed 都是用 next_payment 判斷
					$action_name = $email['action_name'];
					$action_name = in_array( $action_name, $next_payment_action_names, true ) ? 'next_payment' : $action_name;

					$next_payment_time       = $order_date[ $action_name ] + $days_in_time;
					$after_next_payment_time = $next_payment_time + 86400; // 一天後
					$current_time            = time();
					if ( $current_time > $next_payment_time && $current_time < $after_next_payment_time ) {
						$subject = Base::replace_script_tokens( $subject, $order_date['tokens'] );
						$body    = Base::replace_script_tokens( $body, $order_date['tokens'] );
						\wp_mail(
							$order_date_arr['customer_email'],
							$subject,
							$body,
							array( 'Content-Type: text/html; charset=UTF-8' ),
						);
					}
				}
			}
		}
	}

	/**
	 * Get_order_date_arr_by_action
	 * 取得指定 action name 的 最新的續訂訂單創建日期
	 * 有 'subscription_failed' | 'subscription_success' | 'site_sync' 這三種
	 * 'site_sync' 是同步寄送，不需要排程
	 *
	 * @param string $action Action
	 * @return array
	 * ['order_id'] => int
	 * ['order_created_date'] => string 'Y-m-d'
	 */
	public static function get_order_date_arr_by_action( string $action ): array {

		$arr = array();
		switch ( $action ) {
			case Email::SUBSCRIPTION_SUCCESS_ACTION_NAME:
				$post_status = ShopSubscription::$success_statuses;
				break;
			case Email::SUBSCRIPTION_FAILED_ACTION_NAME:
				$post_status = ShopSubscription::$failed_statuses;
				break;

			default:
				$post_status = ShopSubscription::$all_statuses;
				break;
		}

		$subscription_ids = \get_posts(
			array(
				'post_type'      => ShopSubscription::POST_TYPE,
				'posts_per_page' => -1,
				'post_status'    => $post_status,
				'fields'         => 'ids',
				'meta_query'     => array( //phpcs:ignore
					array(
						'key'     => ShopSubscription::IS_POWER_PARTNER_SUBSCRIPTION,
						'compare' => 'EXISTS',
					),
				),
			)
		);

		foreach ( $subscription_ids as $subscription_id ) {
			$subscription = new \WC_Subscription( $subscription_id );
			// @param string $date_type 'date_created', 'trial_end', 'next_payment', 'last_order_date_created', 'end' or 'end_of_prepaid_term'
			$date_created            = $subscription?->get_time( 'date_created' );
			$trial_end               = $subscription?->get_time( 'trial_end' );
			$next_payment            = $subscription?->get_time( 'next_payment' );
			$last_order_date_created = $subscription?->get_time( 'last_order_date_created' );
			$end                     = $subscription?->get_time( 'end' );
			$end_of_prepaid_term     = $subscription?->get_time( 'end_of_prepaid_term' );
			$last_order              = $subscription?->get_last_order(); // order | order_id
			if ( is_numeric( $last_order ) ) {
				$last_order = \wc_get_order( $last_order );
			}

			if ( ! $last_order ) {
				continue;
			}
			$last_order_id = $last_order?->get_id();

			$tokens = array_merge( self::get_order_tokens( $last_order ), self::get_subscription_tokens( $subscription ) );

			$arr[] = array(
				'order_id'                => (int) $last_order_id,
				'customer_email'          => $last_order?->get_billing_email(),
				'date_created'            => $date_created,
				'trial_end'               => $trial_end,
				'last_order_date_created' => $last_order_date_created,
				'next_payment'            => $next_payment,
				'end'                     => $end,
				'end_of_prepaid_term'     => $end_of_prepaid_term,
				'tokens'                  => $tokens,
			);
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
		$customer = $order?->get_user();

		$products = array();
		foreach ( $order?->get_items() as $item_id => $item ) {
			$product_name = $item?->get_name();
			$products[]   = $product_name;
		}
		$products_text = implode( ', ', $products );

		$tokens                         = array();
		$tokens['FIRST_NAME']           = $customer?->first_name;
		$tokens['LAST_NAME']            = $customer?->last_name;
		$tokens['NICE_NAME']            = $customer?->user_nicename;
		$tokens['EMAIL']                = $customer?->user_email;
		$tokens['ORDER_ID']             = $order?->get_id();
		$tokens['ORDER_ITEMS']          = $products_text;
		$tokens['CHECKOUT_PAYMENT_URL'] = $order?->get_checkout_payment_url();
		$tokens['VIEW_ORDER_URL']       = $order?->get_view_order_url();
		$tokens['ORDER_STATUS']         = $order?->get_status();
		$tokens['ORDER_DATE']           = $order?->get_date_created()?->format( 'Y-m-d' );

		return $tokens;
	}

	/**
	 * Get subscription tokens
	 *
	 * @param \WC_Subscription $subscription Subscription
	 * @return array
	 */
	public static function get_subscription_tokens( \WC_Subscription $subscription ): array {
		$parent_id      = $subscription->get_parent_id();
		$site_responses = \get_post_meta( $parent_id, Product::CREATE_SITE_RESPONSES_META_KEY, true );
		$tokens         = array();
		try {
			$site_responses_arr = \json_decode( $site_responses, true );
			$site_info          = $site_responses_arr['data'];
			$tokens['URL']      = $site_info['url'];
		} catch ( \Throwable $th ) {
			ob_start();
			print_r( $th );
			\J7\WpToolkit\Utils::debug_log( '' . ob_get_clean() );
		}

		return $tokens;
	}
}

Cron::get();
