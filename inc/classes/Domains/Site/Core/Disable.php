<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Site\Core;

use J7\PowerPartner\Domains\Site\Services\DisableSiteScheduler;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;

/**
 * Disable Site
 * 排程時間到之後，停用網站
 *  */
final class Disable {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** Constructor */
	public function __construct() {

		// 訂閱成功 -> 失敗時，排程 禁用網站
		\add_action( Action::SUBSCRIPTION_FAILED->get_action_hook(), [ $this, 'schedule_disable_site' ], 10, 2 );

		// 訂閱失敗 -> 成功時，取消 禁用網站 的排程
		\add_action( Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [ $this, 'cancel_disable_site_schedule' ], 10, 2 );
	}

	/**
	 * 排程停用網站
	 *
	 * @param \WC_Subscription     $subscription post
	 * @param array<string, mixed> $args 排程的參數
	 * @return void
	 */
	public function schedule_disable_site( $subscription, $args ): void {
		$power_partner_settings    = \get_option( 'power_partner_settings', [] );
		$disable_site_after_n_days = (int) ( $power_partner_settings['power_partner_disable_site_after_n_days'] ?? '7' );
		$timestamp                 = time() + ( 86400 * $disable_site_after_n_days );

		$disable_site_scheduler = new DisableSiteScheduler( $subscription );
		$disable_site_scheduler->schedule_single( $timestamp, DisableSiteScheduler::DISABLE_SITE_GROUP, true );
	}



	/**
	 * 訂閱成功時，取消  禁用網站 的排程
	 *
	 * @param \WC_Subscription     $subscription post
	 * @param array<string, mixed> $args 排程的參數
	 * @return void
	 */
	public function cancel_disable_site_schedule( $subscription, $args ): void {
		$disable_site_scheduler = new DisableSiteScheduler( $subscription );
		$disable_site_scheduler->unschedule(DisableSiteScheduler::DISABLE_SITE_GROUP);
	}
}
