<?php
/**
 * ShopSubscription 相關
 */

declare(strict_types=1);

namespace J7\PowerPartner\LC;

use J7\PowerPartner\Product\DataTabs\LinkedLC;
use J7\Powerhouse\Api\Base as CloudApi;
use J7\WpUtils\Classes\General;
use J7\PowerPartner\Product\SiteSync;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Connect;

/**
 * Class ShopSubscription
 *
 * Status:
 * active 已啟用
 * cancelled 已取消
 * expired 已過期
 * on-hold 保留
 * pending-cancel 待取消
 */
final class Main {
	use \J7\WpUtils\Traits\SingletonTrait;



	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'woocommerce_subscription_pre_update_status', [ $this, 'subscription_failed' ], 10, 3 );
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
		// 從 [已啟用] 變成 [已取消] 或 [保留] 等等  就算失敗， [已過期] 不算
		$is_subscription_failed = ( ! in_array( $new_status, ShopSubscription::$not_failed_statuses, true ) ) && in_array( $old_status, ShopSubscription::$success_statuses, true );

		// 如果訂閱沒失敗 就不處理
		if ( ! $is_subscription_failed ) {
			return;
		}

		$lc_ids = \get_post_meta($subscription->get_id(), 'lc_id', false);

		// 如果訂閱身上沒有授權碼 就不處理
		if ( ! $lc_ids ) {
			return;
		}

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

		$site_sync_instance = SiteSync::instance();
		$order_ids          = $site_sync_instance->get_related_order_ids( $subscription );

		$parent_order = $subscription->get_parent();

		if ( ! ( $parent_order instanceof \WC_Order ) ) {
			return;
		}

		$parent_order_id = $parent_order->get_id();

		// 確保只有一筆訂單 (parent order) 才會觸發 site sync，續訂不觸發
		if ( count( $order_ids ) !== 1 || ( $order_ids[0] ?? 0 ) !== $parent_order_id ) {
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
			 * @var array<int, array{id: int, status: string, code: string, type: string, subscription_id: int, customer_id: int, expire_date: int, domain: string, product_slug: string, product_key: string, product_name: string}> $license_codes
			 */
			$license_codes = $data['data']['license_codes'] ?? [];
			if (is_array($license_codes)) {
				foreach ($license_codes as $license_code) {
					$all_lc_ids[] = $license_code['id'];
				}
			}

			$subscription->add_order_note("站長路可《新增》授權碼 ✅成功: \n" . \wp_json_encode($data, JSON_UNESCAPED_UNICODE));
		}

		// 把資訊紀錄在 subscription
		$subscription->update_meta_data(LinkedLC::FIELD_NAME, $all_linked_lc_products);

		foreach ($all_lc_ids as $lc_id) {
			$subscription->add_meta_data('lc_id', $lc_id);
		}
		$subscription->save();
	}
}
