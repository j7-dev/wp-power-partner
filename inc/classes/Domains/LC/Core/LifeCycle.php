<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\LC\Core;

use J7\PowerPartner\Product\DataTabs\LinkedLC;
use J7\Powerhouse\Api\Base as CloudApi;
use J7\WpUtils\Classes\General;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Connect;

/**
 * LC 生命週期
 *
 * Status:
 * active 已啟用
 * cancelled 已取消
 * expired 已過期
 * on-hold 保留
 * pending-cancel 待取消
 */
final class LifeCycle {
	use \J7\WpUtils\Traits\SingletonTrait;

	const EXPIRE_ACTION = 'power_partner_lc_expire';
	const DELAY_TIME    = 4 * HOUR_IN_SECONDS; // 延遲多久才執行


	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'woocommerce_subscription_pre_update_status', [ $this, 'subscription_failed' ], 10, 3 );
		\add_action(self::EXPIRE_ACTION, [ $this, 'process_expire_lcs' ], 10, 2);

		\add_action( 'woocommerce_subscription_pre_update_status', [ $this, 'subscription_success' ], 10, 3 );

		\add_action( 'woocommerce_subscription_payment_complete', [ $this, 'create_lcs' ], 10, 1 );
	}

	/**
	 * Subscription failed
	 * 如果用戶續訂失敗，則停用授權碼
	 *
	 * @param string           $old_status old status
	 * @param string           $new_status new status
	 * @param \WC_Subscription $subscription post
	 * @return void
	 */
	public function subscription_failed( $old_status, $new_status, $subscription ): void {

		if ( ! ( $subscription instanceof \WC_Subscription ) ) {
			return;
		}

		// 從成功變成失敗
		// 從 [已啟用] 變成 [已取消] [已過期] [保留] 等等 就算失敗 [待取消]不算失敗
		$is_subscription_failed = ( in_array( $new_status, ShopSubscription::$failed_statuses, true ) ) && in_array( $old_status, ShopSubscription::$not_failed_statuses, true );

		// 如果訂閱不是轉變為失敗 就不處理
		if ( ! $is_subscription_failed ) {
			return;
		}

		$subscription_id = $subscription->get_id();
		$lc_ids          = \get_post_meta($subscription_id, 'lc_id', false);

		// 如果訂閱身上沒有授權碼 就不處理
		if ( ! $lc_ids ) {
			return;
		}

		$timestamp = time() + self::DELAY_TIME;

		$action_id = \as_schedule_single_action(
			$timestamp,
			self::EXPIRE_ACTION,
			[ $lc_ids, $subscription_id ]
			);

		$date = \wp_date('Y-m-d H:i', $timestamp);

		$subscription->add_order_note("已排程動作 #{$action_id}， 於 {$date} 停用授權碼");
		$subscription->add_meta_data('power_partner_lc_expire_action_id', $action_id);
		$subscription->save();
	}

	/**
	 * 處理過期授權碼
	 *
	 * @param array<int, int> $lc_ids 授權碼 id
	 * @param int             $subscription_id 訂閱 id
	 * @return void
	 */
	public function process_expire_lcs( array $lc_ids, int $subscription_id ): void {
		$subscription = \wcs_get_subscription($subscription_id);

		$action_id = $subscription->get_meta('power_partner_lc_expire_action_id');
		// 如果沒有 action_id 就不處理
		if (!$action_id) {
			return;
		}

		// 發API停用授權碼
		// 訂閱失敗，發API停用授權碼
		$api_instance = CloudApi::instance();
		$response     = $api_instance->remote_post(
			'license-codes/expire',
			[
				'ids' => $lc_ids,
			]
		);
		$is_error     = \is_wp_error($response);
		if ($is_error) {
			$subscription->add_order_note("站長路可《過期》授權碼 ❌失敗: \n{$response->get_error_message()}");
			return;
		}

		$body = \wp_remote_retrieve_body($response);
		$data = General::json_parse($body, []);

		$subscription->add_order_note("站長路可《過期》授權碼 ✅成功: \n" . \wp_json_encode($data, JSON_UNESCAPED_UNICODE));
	}


	/**
	 * Subscription success
	 * 如果手動調整訂閱成功，則讓授權碼變成可用
	 *
	 * @param string           $old_status old status
	 * @param string           $new_status new status
	 * @param \WC_Subscription $subscription post
	 * @return void
	 */
	public function subscription_success( $old_status, $new_status, $subscription ): void {

		if ( ! ( $subscription instanceof \WC_Subscription ) ) {
			return;
		}

		// 從失敗變成成功
		// 從 [已取消] [已過期] [保留] 變成 [已啟用] 等等  就算成功
		$is_subscription_success = ( in_array( $new_status, ShopSubscription::$success_statuses, true ) ) && in_array( $old_status, ShopSubscription::$failed_statuses, true );

		// 如果訂閱不是轉變為成功 就不處理
		if ( ! $is_subscription_success ) {
			return;
		}

		$lc_ids = \get_post_meta($subscription->get_id(), 'lc_id', false);

		// 如果訂閱身上沒有授權碼 就不處理
		if ( ! $lc_ids ) {
			return;
		}

		$action_id = $subscription->get_meta('power_partner_lc_expire_action_id');
		// 如果有 action_id ，代表目前還是[啟用/可用]狀態，取消排程動作就可以了
		if ($action_id) {
			$subscription->delete_meta_data('power_partner_lc_expire_action_id');
			$subscription->save();
			$status = \ActionScheduler_Store::instance()->get_status($action_id);
			if ('pending' === $status) {
				\ActionScheduler_Store::instance()->delete_action($action_id);
				$subscription->add_order_note("已取消排程動作 #{$action_id}");
				return;
			}

			$subscription->add_order_note("排程動作 #{$action_id}，狀態為 {$status}，無法取消");
			return;
		}

		// 沒有 action_id ，代表目前是[過期/停用]狀態，發API讓授權碼變成可用
		// 訂閱轉為成功，發API讓授權碼變成可用
		$api_instance = CloudApi::instance();
		$response     = $api_instance->remote_post(
			'license-codes/recover',
			[
				'ids' => $lc_ids,
			]
		);
		$is_error     = \is_wp_error($response);
		if ($is_error) {
			$subscription->add_order_note("站長路可《重啟》授權碼 ❌失敗: \n{$response->get_error_message()}");
			return;
		}

		$body = \wp_remote_retrieve_body($response);
		$data = General::json_parse($body, []);

		$subscription->add_order_note("站長路可《重啟》授權碼 ✅成功: \n" . \wp_json_encode($data, JSON_UNESCAPED_UNICODE));
	}

	/**
	 * 創建授權碼
	 *
	 * @param \WC_Subscription $subscription subscription
	 * @return void
	 */
	public function create_lcs( \WC_Subscription $subscription ) {
		$partner_id = \get_option(Connect::PARTNER_ID_OPTION_NAME);
		if ( ! $partner_id ) {
			return;
		}

		$related_order_ids = $subscription->get_related_orders();

		$parent_order = $subscription->get_parent();

		if ( ! ( $parent_order instanceof \WC_Order ) ) {
			return;
		}

		$parent_order_id = $parent_order->get_id();

		// 確保只有一筆訂單 (parent order) 才會觸發 site sync，續訂不觸發
		if ( count( $related_order_ids ) !== 1 ) {
			return;
		}

		// 唯一一筆關聯訂單必須要 = parent order id
		if ( ( (int) reset( $related_order_ids ) ) !== ( (int) $parent_order_id )) {
			return;
		}

		/**
		 * @var array<int, array{product_slug:string, quantity:string}> $linked_lc_products
		 */
		$all_linked_lc_products = [];

		/**
		 * @var array<int, \WC_Order_Item_Product> $items
		 */
		$items = $parent_order->get_items();

		// 把訂單中每個商品的 LinkedLC 找出來拼成一個陣列
		foreach ($items as $item) {
			$product = $item->get_product();
			if (!( $product instanceof \WC_Product )) {
				continue;
			}
			$product_type = $product->get_type();

			if ( strpos( $product_type, 'variable' ) !== false ) {
				$variation_id       = $item->get_variation_id();
				$linked_lc_products = \get_post_meta($variation_id, LinkedLC::FIELD_NAME, true);
				if (!is_array($linked_lc_products)) {
					$linked_lc_products = [];
				}
				$all_linked_lc_products = $all_linked_lc_products + $linked_lc_products;
			} else {
				$product_id         = $product->get_id();
				$linked_lc_products = \get_post_meta($product_id, LinkedLC::FIELD_NAME, true);
				if (!is_array($linked_lc_products)) {
					$linked_lc_products = [];
				}
				$all_linked_lc_products = $all_linked_lc_products + $linked_lc_products;
			}
		}

		/**
		 * @var array<int, int> $all_lc_ids 創建的授權碼 id
		 */
		$all_lc_ids = [];

		// 打API給站長路可新增授權碼
		$api_instance = CloudApi::instance();

		foreach ($all_linked_lc_products as $linked_lc_product) {
			$params                    = $linked_lc_product;
			$params['post_author']     = $partner_id;
			$params['subscription_id'] = $subscription->get_id();
			$params['customer_id']     = $subscription->get_customer_id();
			$response                  = $api_instance->remote_post(
				'license-codes',
				$params
			);

			$is_error = \is_wp_error($response);
			if ($is_error) {
				$subscription->add_order_note("站長路可《新增》授權碼 ❌失敗: \n{$response->get_error_message()}");
				continue;
			}

			$body = \wp_remote_retrieve_body($response);
			$data = General::json_parse($body, []);

			/**
			 * @var array<int, array{id: int, status: string, code: string, type: string, subscription_id: int, customer_id: int, expire_date: int, domain: string, product_slug: string, download_url: string, product_name: string}> $license_codes
			 */
			$license_codes = $data['data']['license_codes'] ?? [];
			if (is_array($license_codes)) {
				foreach ($license_codes as $license_code) {
					$all_lc_ids[] = $license_code['id'];
				}
			}

			$subscription->add_order_note("站長路可《新增》授權碼 ✅成功: \n" . \wp_json_encode($data, JSON_UNESCAPED_UNICODE));

			self::send_email_to_subscriber($subscription, $license_codes);
		}

		// 把資訊紀錄在 subscription
		$subscription->update_meta_data(LinkedLC::FIELD_NAME, $all_linked_lc_products);

		foreach ($all_lc_ids as $lc_id) {
			$subscription->add_meta_data('lc_id', $lc_id);
		}
		$subscription->save();
	}

	/**
	 * 寄信給客戶
	 *
	 * phpcs:disable
	 * @param \WC_Subscription $subscription 訂閱
	 * @param array<int, array{id: int, status: string, code: string, type: string, subscription_id: int, customer_id: int, expire_date: int, domain: string, product_slug: string, download_url: string, product_name: string}> $license_codes 授權碼
	 * @return void
	 * phpcs:enable
	 */
	public static function send_email_to_subscriber( \WC_Subscription $subscription, array $license_codes ): void {
		$email = $subscription->get_billing_email();
		if ( ! $email ) {
			return;
		}

		$display_name = $subscription->get_billing_last_name() . $subscription->get_billing_first_name();

		$product_name = $license_codes[0]['product_name']; // 這批 license_codes 都是同樣產品

		$download_url = $license_codes[0]['download_url'];
		$doc_url      = match ($license_codes[0]['product_slug']) {
			'power-shop' => 'https://docs.wpsite.pro/powershop',
			'power-course' => 'https://docs.wpsite.pro/powercourse',
			default => '',
		};

		$subject = "您的《{$product_name}》授權碼已開通 - " . \get_bloginfo('name');

		$message  = "{$display_name} 您好:<br><br>";
		$message .= "您在 {$subscription->get_date_created()->date('Y-m-d')} 訂購的授權碼 (訂閱編號 #{$subscription->get_id()}) 已經開通，以下是您的授權碼:<br><br>";

		$message .= "產品: {$product_name}<br><br>";
		if ($download_url) {
			$message .= "外掛下載連結: <a href='{$download_url}' target='_blank'>{$download_url}</a><br><br>";
		}
		if ($doc_url) {
			$message .= "外掛教學連結: <a href='{$doc_url}' target='_blank'>{$doc_url}</a><br><br>";
		}

		foreach ($license_codes as $license_code) {
			$message .= "授權碼: {$license_code['code']}<br>";
			$message .= '到期日: 跟隨訂閱<br>';
			$message .= '<br>';
		}

		$headers = [ 'Content-Type: text/html; charset=UTF-8' ];

		\wp_mail($email, $subject, $message, $headers);
	}
}
