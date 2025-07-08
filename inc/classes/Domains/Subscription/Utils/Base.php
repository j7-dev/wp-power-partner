<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Subscription\Utils;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\SiteSync;
use J7\PowerPartner\Domains\Site\Core\Disable;

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
	 * @param \WC_Subscription $subscription 訂閱
	 * @return void
	 */
	public static function disable_sites( \WC_Subscription $subscription ) {
		$subscription_id               = $subscription->get_id();
		$is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true );

		if (!$is_power_partner_subscription) {
			return;
		}

		// 取得設定中，過 N 天要禁用網站，N 的天數
		$power_partner_settings    = \get_option( 'power_partner_settings', [] );
		$disable_site_after_n_days = (int) ( $power_partner_settings['power_partner_disable_site_after_n_days'] ?? '7' );

		$action_id         = $subscription->get_meta( Disable::DISABLE_SITE_ACTION_ID_META_KEY, true );
		$scheduled_actions = \as_get_scheduled_actions(
			[
				'hook'  => Disable::DISABLE_SITE,
				'group' => Disable::DISABLE_SITE_GROUP,
			],
			'ids'
			);
		$is_scheduled      = (bool) $scheduled_actions || (bool) $action_id;
		if ($is_scheduled) {
			Plugin::log(
				"訂閱 #{$subscription_id} 已經排程停用網站，不會重複排程",
				'info',
				[
					'action_id'         => $action_id,
					'scheduled_actions' => $scheduled_actions,
				]
				);
			return;
		}

		$action_id = \as_schedule_single_action( time() + ( 86400 * $disable_site_after_n_days ), Disable::DISABLE_SITE, [ $subscription_id ], Disable::DISABLE_SITE_GROUP );
		$subscription->add_meta_data( Disable::DISABLE_SITE_ACTION_ID_META_KEY, $action_id, true );
		$subscription->save();
		Plugin::log( "訂閱 #{$subscription_id} 排程停用網站", 'info', [ 'action_id' => $action_id ] );
	}
}
