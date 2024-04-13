<?php
/**
 * ShopSubscription 相關
 */

declare (strict_types = 1);

namespace J7\PowerPartner;

use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\DataTabs;

/**
 * Class ShopSubscription
 */
final class ShopSubscription {

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'transition_post_status', array( $this, 'subscription_failed' ), 10, 3 );
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

		if ( 'shop_subscription' !== $post?->post_type ) {
			return;
		}
		// 從 [已啟用] 變成 [已取消] 或 [已過期] 或 [保留] 等等  就算失敗
		$is_subscription_failed = 'wc-active' !== $new_status && 'wc-active' === $old_status;

		if ( $is_subscription_failed ) {
			// 找到連結的訂單， post_parent 是訂單編號
			$order_id        = $post?->post_parent;
			$linked_site_ids = \get_post_meta( $order_id, Product::LINKED_SITE_IDS_META_KEY, true );
			$linked_site_ids = is_array( $linked_site_ids ) ? $linked_site_ids : array();

			// disable 訂單網站
			foreach ( $linked_site_ids as $site_id ) {
				// Fetch::disable_site( $site_id );
			}
		}
	}
}

new ShopSubscription();
