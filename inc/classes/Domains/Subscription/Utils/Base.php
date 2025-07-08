<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Subscription\Utils;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\SiteSync;

/** Base  */
abstract class Base {

	/**
	 * 取得訂閱的最新訂單
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return \WC_Order|null
	 */
	public static function get_last_order( \WC_Subscription $subscription ) {
		/** @var numeric-string|false $last_order_id */
		$last_order_id = $subscription->get_last_order('ids');
		if ( !$last_order_id ) {
			Plugin::log( "找不到 訂閱 #{$subscription->get_id()} 最近的 order_id", 'error' );
			return null;
		}

		$last_order = \wc_get_order( $last_order_id );
		if ( ! $last_order instanceof \WC_Order ) {
			Plugin::log( "訂閱 #{$subscription->get_id()} 最近的 order 不是 WC_Order 實例", 'error' );
			return null;
		}

		return $last_order;
	}


	/**
	 * Disable sites
	 *
	 * @param int $subscription_id 訂閱 ID
	 * @return void
	 */
	public static function disable_sites( int $subscription_id ) {

		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription ) {
			Plugin::log( "停用網站失敗，訂閱 #{$subscription_id} 不是 WC_Subscription 實例", 'error' );
			return;
		}

		$is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true );
		if (!$is_power_partner_subscription) {
			return;
		}

		$last_failed_timestamp = (int) ( $subscription->get_meta( ShopSubscription::LAST_FAILED_TIMESTAMP_META_KEY, true ) );
		$diff                  = time() - $last_failed_timestamp;
		$diff_in_days          = round( $diff / 86400, 2 ); // 今天與上次失敗的時間差幾天

		// 取得設定中，過 N 天要禁用網站，N 的天數
		$power_partner_settings    = \get_option( 'power_partner_settings', [] );
		$disable_site_after_n_days = (int) ( $power_partner_settings['power_partner_disable_site_after_n_days'] ?? '7' );

		if ( ( $diff_in_days < $disable_site_after_n_days ) ) {
			Plugin::log( "訂閱 #{$subscription_id} 未過 {$disable_site_after_n_days} 天，不會停用網站", 'info' );
			return;
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
