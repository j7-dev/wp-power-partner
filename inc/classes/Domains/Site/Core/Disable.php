<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Site\Core;

use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Plugin;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Domains\Subscription\Utils\Base as SubscriptionUtils;

/**
 * Disable Site
 * 排程時間到之後，停用網站
 *  */
final class Disable {
	use \J7\WpUtils\Traits\SingletonTrait;

	const DISABLE_SITE = 'power_partner_disable_site';

	const DISABLE_SITE_GROUP = 'power_partner_disable_site_group';

	const DISABLE_SITE_ACTION_ID_META_KEY = 'disable_site_action_id'; // 如果有排程停用網站會記錄在訂閱的 meta 裡面

	/** Constructor */
	public function __construct() {
		\add_action( self::DISABLE_SITE, [ $this, 'disable_site' ], 10, 1 );

		// 狀態改變時檢查
		\add_action( 'woocommerce_subscription_status_updated', [ $this, 'subscription_status_changed' ], 10, 3 );
	}

	/**
	 * Disable site
	 *
	 * @param string $subscription_id Subscription ID
	 * @return void
	 */
	public function disable_site( $subscription_id ) {
		$subscription = \wcs_get_subscription( $subscription_id );
		if (!$subscription) {
			Plugin::log( "訂閱 #{$subscription_id} 不存在", 'error', [ 'subscription_id' => $subscription_id ] );
			return;
		}

		$linked_site_ids = ShopSubscription::get_linked_site_ids( $subscription_id );
		$order_id        = $subscription->get_parent_id();
		// disable 訂單網站
		foreach ( $linked_site_ids as $site_id ) {
			$reason = "停用網站，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}，網站ID: {$site_id}";

			Fetch::disable_site( $site_id, $reason );
			$subscription->add_order_note( $reason );
			$subscription->save();
			Plugin::log($reason);
		}
	}


	/**
	 *
	 * @see WCS_Action_Scheduler::get_scheduled_action_hook
	 * @see woocommerce_subscription_status_updated
	 * @param \WC_Subscription $subscription post
	 * @param string           $to_status new status
	 * @param string           $from_status old status
	 * @return void
	 */
	public function subscription_status_changed( $subscription, $to_status, $from_status ): void {
		// 失敗時，排程停用網站
		if (in_array($to_status, ShopSubscription::$failed_statuses, true)) {
			SubscriptionUtils::disable_sites( $subscription );
		}

		// 成功時，取消排程
		if (in_array($to_status, ShopSubscription::$success_statuses, true)) {
			$action_id = \as_unschedule_action( self::DISABLE_SITE, [ $subscription->get_id() ], self::DISABLE_SITE_GROUP );
			Plugin::log( "訂閱 #{$subscription->get_id()} 成功，取消排程停用網站", 'info', [ 'action_id' => $action_id ] );
		}
	}
}
