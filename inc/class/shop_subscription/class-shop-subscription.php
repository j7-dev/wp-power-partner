<?php
/**
 * ShopSubscription 相關
 */

declare (strict_types = 1);

namespace J7\PowerPartner\ShopSubscription;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\DataTabs;
use J7\PowerPartner\Product\Product;


/**
 * Class ShopSubscription
 *
 * Status:
 * wc-active 已啟用
 * wc-cancelled 已取消
 * wc-expired 已過期
 * wc-on-hold 保留
 * wc-pending-cancel 待取消
 */
final class ShopSubscription {

	const IS_POWER_PARTNER_SUBSCRIPTION  = 'is_' . Plugin::SNAKE;
	const LAST_FAILED_TIMESTAMP_META_KEY = Plugin::SNAKE . '_last_failed_timestamp';

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'transition_post_status', array( $this, 'subscription_failed' ), 10, 3 );
		\add_action( 'wcs_create_subscription', array( $this, 'add_post_meta' ), 10, 1 );
	}

	/**
	 * Subscription failed
	 * 如果用戶續訂失敗，則停用訂單網站
	 *
	 * @param string   $new_status new status
	 * @param string   $old_status old status
	 * @param \WP_POST $post post
	 * @return void
	 */
	public function subscription_failed( $new_status, $old_status, $post ): void {

		// 如果不是訂閱商品 就不處理
		if ( 'shop_subscription' !== $post?->post_type ) {
			return;
		}

		$subscription_id               = $post?->ID;
		$is_power_partner_subscription = \get_post_meta( $subscription_id, self::IS_POWER_PARTNER_SUBSCRIPTION, true );
		// 如果不是 power partner 網站訂閱 就不處理
		if ( ! $is_power_partner_subscription ) {
			return;
		}

		// 從 [已啟用] 變成 [已取消] 或 [保留] 等等  就算失敗， [已過期] 不算
		$is_subscription_failed = ( ! in_array( $new_status, array( 'wc-active', 'wc-expired' ), true ) ) && in_array( $old_status, array( 'wc-active' ), true );

		// 如果訂閱沒失敗 就不處理，並且清除上次失敗的時間
		if ( ! $is_subscription_failed ) {
			\delete_post_meta( $subscription_id, self::LAST_FAILED_TIMESTAMP_META_KEY );
			return;
		}

		// 找到連結的訂單， post_parent 是訂單編號
		$order_id        = $post?->post_parent;
		$linked_site_ids = \get_post_meta( $order_id, Product::LINKED_SITE_IDS_META_KEY, true );
		$linked_site_ids = is_array( $linked_site_ids ) ? $linked_site_ids : array();

		// disable 訂單網站
		foreach ( $linked_site_ids as $site_id ) {
			Fetch::disable_site( $site_id );
		}

		// 記錄失敗時間，因為要搭配 CRON 判斷過了多久然後發信
		\update_post_meta( $subscription_id, self::LAST_FAILED_TIMESTAMP_META_KEY, time() );
	}

	/**
	 * Add post meta
	 * 加入 post meta 識別是網站訂閱
	 *
	 * @param \WC_Subscription $subscription subscription
	 * @return void
	 */
	public function add_post_meta( $subscription ) {
		$subscription    = \wcs_get_subscription( $subscription );
		$subscription_id = $subscription?->get_id();
		\update_post_meta( $subscription_id, self::IS_POWER_PARTNER_SUBSCRIPTION, true );
	}
}

new ShopSubscription();
