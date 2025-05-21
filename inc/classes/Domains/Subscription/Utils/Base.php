<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Subscription\Utils;

use J7\PowerPartner\Plugin;

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
}
