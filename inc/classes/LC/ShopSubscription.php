<?php
/**
 * ShopSubscription 相關
 */

declare(strict_types=1);

namespace J7\PowerPartner\LC;

use J7\PowerPartner\Product\DataTabs\LinkedLC;
use J7\Powerhouse\Api\Base as Api;
use J7\WpUtils\Classes\General;

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
final class ShopSubscription {
	use \J7\WpUtils\Traits\SingletonTrait;



	/**
	 * Constructor
	 */
	public function __construct() {
		// \add_action( 'woocommerce_subscription_pre_update_status', [ $this, 'subscription_failed' ], 10, 3 );
		\add_action( 'wcs_create_subscription', [ $this, 'add_meta' ], 10, 1 );

		\add_action(
		'init',
		function () {
			// $api_instance = Api::instance();
			// $response     = $api_instance->remote_post(
			// 'license-codes',
			// [
			// 'body' => json_encode(
			// [
			// 'quantity' => 1,
			// ]
			// ),
			// ]
			// );

			// $body = \wp_remote_retrieve_body($response);

			// ob_start();
			// var_dump($body);
			// \J7\WpUtils\Classes\Log::info('' . ob_get_clean());
		}
		);
	}

	/**
	 * Subscription failed
	 * 如果用戶續訂失敗，則停用訂單網站
	 *
	 * @param string           $old_status old status
	 * @param string           $new_status new status
	 * @param \WC_Subscription $subscription post
	 * @return void
	 */
	// public function subscription_failed( $old_status, $new_status, $subscription ): void {

	// if ( ! ( $subscription instanceof \WC_Subscription ) ) {
	// return;
	// }

	// $subscription_id               = $subscription->get_id();
	// $is_power_partner_subscription = $subscription->get_meta( self::IS_POWER_PARTNER_SUBSCRIPTION, true );

	// 如果不是 power partner 網站訂閱 就不處理
	// if ( ! $is_power_partner_subscription ) {
	// return;
	// }

	// 從 [已啟用] 變成 [已取消] 或 [保留] 等等  就算失敗， [已過期] 不算
	// $is_subscription_failed = ( ! in_array( $new_status, self::$not_failed_statuses, true ) ) && in_array( $old_status, self::$success_statuses, true );

	// 如果訂閱沒失敗 就不處理，並且刪除 上次失敗的時間 紀錄
	// if ( ! $is_subscription_failed ) {
	// $subscription->delete_meta_data( self::LAST_FAILED_TIMESTAMP_META_KEY );
	// $subscription->save();
	// return;
	// }

	// 記錄當下失敗時間，因為要搭配 CRON 判斷過了多久然後發信
	// $subscription->update_meta_data( self::LAST_FAILED_TIMESTAMP_META_KEY, time() );
	// $subscription->save();
	// }

	/**
	 * Add post meta
	 *
	 * @param \WC_Subscription $subscription subscription
	 * @return void
	 */
	public function add_meta( \WC_Subscription $subscription ) {
		if ( ! ( $subscription instanceof \WC_Subscription ) ) {
			return;
		}

		$parent_order_id = $subscription->get_parent_id();
		$parent_order    = \wc_get_order( $parent_order_id );

		if ( ! ( $parent_order instanceof \WC_Order ) ) {
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

		// 打API給站長路可新增授權碼
		$api_instance = Api::instance();

		foreach ($all_linked_lc_products as $linked_lc_product) {
			$response = $api_instance->remote_post(
				'license-codes',
				$linked_lc_product
			);

			$is_error = \is_wp_error($response);
			if ($is_error) {
				$subscription->add_order_note("站長路可新增授權碼 ❌失敗: \n{$response->get_error_message()}");
				continue;
			}

			$body = \wp_remote_retrieve_body($response);
			$data = General::json_parse($body, []);

			$subscription->add_order_note("站長路可新增授權碼 ✅成功: \n" . \wp_json_encode($data, JSON_UNESCAPED_UNICODE));
		}
	}
}
