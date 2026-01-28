<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Site\Core;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Domains\Site\Services\DisableSiteScheduler;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;
use J7\PowerPartner\Product\DataTabs\LinkedSites;
use J7\PowerPartner\Product\SiteSync;
use J7\PowerPartner\Api\FetchPowerCloud;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Api\Fetch;

/**
 * 註冊 Disable Site 相關的 action hook
 * 排程時間到之後，停用網站
 *  */
final class DisableHooks {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** Constructor */
	public function __construct() {
		DisableSiteScheduler::register();

		// 訂閱成功 -> 失敗時，排程 禁用網站
		\add_action( Action::SUBSCRIPTION_FAILED->get_action_hook(), [ $this, 'schedule_disable_site' ], 10, 2 );

		// // 訂閱失敗 -> 成功時，取消 禁用網站 的排程
		// \add_action( Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [ $this, 'cancel_disable_site_schedule' ], 10, 2 );

		// 訂閱成功 -> 成功時，重新啟用所有停止的網站，並且取消 禁用網站 的排程
		\add_action( Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [ $this, 'restart_all_stopped_sites_scheduler' ], 10, 2 );
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
		// $timestamp                 = time() + 1; // 測試用, 記得移除 -----


		$disable_site_scheduler = new DisableSiteScheduler( $subscription );
		$disable_site_scheduler->maybe_unschedule('', true);
		$disable_site_scheduler->schedule_single( $timestamp );
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
		$disable_site_scheduler->unschedule();
	}

		/**
	 * 訂閱成功時 取消所有已排程的禁用網站的排程, 並且重新啟用所有停止的網站
	 *
	 * @param \WC_Subscription     $subscription post
	 * @param array<string, mixed> $args 排程的參數
	 * @return void
	 */
	public function restart_all_stopped_sites_scheduler( $subscription, $args ): void {
		$subscription_id = $subscription->get_id();
		// 1. 取消 所有已排程 的 禁用網站 的排程
		$disable_site_scheduler = new DisableSiteScheduler( $subscription );
		$disable_site_scheduler->unschedule();

		// 2. 拿到 subscription 的所有網站
		$parent_order = $subscription->get_parent();
		$current_user_id = $parent_order->get_customer_id();
		$items        = $parent_order->get_items();

		$linked_site_ids = ShopSubscription::get_linked_site_ids( $subscription_id );

		// WPCD 的數據放在 subscription 的 meta data
		foreach ( $linked_site_ids as $site_id ) {
			Fetch::enable_site( $site_id );
		}

		// PowerCloud 的數據放在 order item 的 meta data
		foreach ( $items as $item ) {
			/** @var \WC_Order_Item_Product $item */
			$product_id = $item->get_variation_id() ?: $item->get_product_id();
			$host_type = \get_post_meta( $product_id, LinkedSites::HOST_TYPE_FIELD_NAME, true );

			// powercloud 為新架構（新架構是默認Host Type)
			if ( $host_type === LinkedSites::DEFAULT_HOST_TYPE ) {
				$websiteId = null;
				$order_item = $item->get_meta( SiteSync::CREATE_SITE_RESPONSES_ITEM_META_KEY );
				// get websiteId from order_item
				if ( ! empty( $order_item ) ) {
					$responses = json_decode( $order_item, true );
					if ( is_array( $responses ) && ! empty( $responses ) ) {
						// 取第一個 response 的 data.websiteId
						$first_response = $responses[0];
						if ( isset( $first_response['data']['websiteId'] ) ) {
							$websiteId = $first_response['data']['websiteId'];
						}
					}
				}

				if ( empty( $websiteId ) ) {
					Plugin::logger(
						"訂閱 #{$subscription_id} 的訂單項目 #{$item->get_id()} 找不到 websiteId",
						'error',
						[
							'order_item' => $order_item,
							'item_id'    => $item->get_id(),
						]
					);
					continue;
				}

				FetchPowerCloud::enable_site( (string)$current_user_id, $websiteId );
				Plugin::logger('restart wordpress site success', 'info', [
					'websiteId' => $websiteId,
					'subscription_id' => $subscription_id,
				]);
				continue;

			}
		}
		
	}
}
