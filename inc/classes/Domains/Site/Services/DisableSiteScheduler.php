<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Site\Services;

use J7\PowerPartner\Plugin;
use J7\Powerhouse\Domains\AsSchedulerHandler\Shared\Base;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Product\DataTabs\LinkedSites;
use J7\PowerPartner\Product\SiteSync;

/**
 * 排程禁用網站
 */
final class DisableSiteScheduler extends Base {

	/** @var string 排程的 hook */
	protected static string $hook = 'power_partner/3.1.0/site/disable';

	/**
	 * Constructor，每次傳入的資源實例可能不同
	 *
	 * @param \WC_Subscription $item 訂閱
	 * @throws \Exception 如果 $item 不是 \WC_Subscription 實例
	 */
	public function __construct(
		/** @var \WC_Subscription 訂閱 */
		protected $item,
	) {
		if ( ! $item instanceof \WC_Subscription ) {
			throw new \Exception('$item 不是 WC_Subscription 實例');
		}

		parent::__construct( $item );
	}

	/**
	 * 取得排程的參數，執行時會傳入 action_callback
	 *
	 * @return array{subscription_id: int}
	 * */
	protected function get_args(): array {
		return [
			'subscription_id' => $this->item->get_id(),
		];
	}

	/**
	 * 取得排程的 callback
	 *
	 * @param array{subscription_id: int} $args 排程的參數
	 * @return void
	 */
	public static function action_callback( $args ): void {
		$subscription_id = null;
		if (is_array($args)) {
			$subscription_id = $args['subscription_id'] ?? 0;
		}
		if (is_numeric($args)) {
			$subscription_id = $args;
		}

		if (!$subscription_id) {
			Plugin::logger( '找不到 subscription_id', 'error', $args );
			return;
		}

		$subscription = \wcs_get_subscription( $subscription_id );
		if (!$subscription) {
			Plugin::logger( "訂閱 #{$subscription_id} 不存在", 'error', [ 'subscription_id' => $subscription_id ] );
			return;
		}

		$linked_site_ids = ShopSubscription::get_linked_site_ids( $subscription_id );
		$order_id        = $subscription->get_parent_id();

		// // disable 訂單網站
		// foreach ( $linked_site_ids as $site_id ) {
		// 	$reason = "停用網站，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}，網站ID: {$site_id}";

		// 	Fetch::disable_site( $site_id, $reason );
		// 	$subscription->add_order_note( $reason );
		// 	$subscription->save();
		// 	Plugin::logger($reason);
		// }

		// 從訂閱的父訂單獲取產品資訊，取得 host_type
		$parent_order = $subscription->get_parent();
		$host_type = LinkedSites::DEFAULT_HOST_TYPE; // 預設值

		if ( $parent_order instanceof \WC_Order ) {
			$items = $parent_order->get_items();
			foreach ( $items as $item ) {
				/** @var \WC_Order_Item_Product $item */
				// item->get_id()
				$product_id = $item->get_variation_id() ?: $item->get_product_id();
				/** @var \WC_Product $product */
				$product    = \wc_get_product( $product_id );

				if ( ! $product || ! \in_array( $product->get_type(), [ 'subscription', 'subscription_variation' ], true ) ) {
					continue;
				}

				// 從product獲取 host_type
				$host_type = \get_post_meta( $product_id, LinkedSites::HOST_TYPE_FIELD_NAME, true );
				if ( empty( $host_type ) ) {
					$host_type = LinkedSites::DEFAULT_HOST_TYPE;
				}

				// 如果 host_type 為 WPCD 舊架構
				if($host_type === LinkedSites::WPCD_HOST_TYPE) {
					// linked_site_id => 模板站ID
					// $linked_site_id = \get_post_meta( $product_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );
					$site_id = $item->get_meta( SiteSync::CREATE_SITE_RESPONSES_ITEM_META_KEY );
					$reason = "停用網站，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}，網站ID: {$site_id}";
					Fetch::disable_site( $site_id, $reason );
					$subscription->add_order_note( $reason );
					$subscription->save();
					Plugin::logger($reason);
					continue;
				}

				// 如果 host_type 為 PowerCloud 新架構
				if($host_type === LinkedSites::DEFAULT_HOST_TYPE) {
					$websiteId = null;
					$jsonString = $item->get_meta( SiteSync::CREATE_SITE_RESPONSES_ITEM_META_KEY );
					$dataArray = json_decode($jsonString, true);
	
					if (json_last_error() === JSON_ERROR_NONE && isset($dataArray[0]['data']['websiteId'])) {
						$websiteId = $dataArray[0]['data']['websiteId'];
					} else {
						continue;
					}

					// TEST ----- ▼ 印出 WC Logger 記得移除 ----- //
					\J7\WpUtils\Classes\WC::logger('disable_site_scheduler', 'info', [
						'order_id' => $order_id,
						'product' => [
							'id' => $product->get_id(),
							'name' => $product->get_name(),
							'host_type' => $host_type,
						],
						'powercloud_linked_website_id' => $websiteId,
					]);
					// TEST ---------- END ---------- //	

					// TODO: Using FetchPowerCloud::disable_site to disable the site
					continue;
				}

			}
		}
	}

	/**
	 * 排程後，寫入 log
	 *
	 * @param int    $action_id 排程的 action_id
	 * @param int    $timestamp 排程的時間
	 * @param string $group     排程的群組
	 * @return void
	 */
	public function after_schedule_single( int $action_id, int $timestamp, string $group ): void {
		$date = \wp_date( 'Y-m-d H:i', $timestamp );
		$this->item->add_order_note( $action_id ? "已排程停用網站，預計於 {$date} 停用網站，action_id: {$action_id}" : "排程停用網站失敗，action_id: {$action_id}" );
		Plugin::logger( "訂閱 #{$this->item->get_id()} 排程停用網站", 'info', [ 'action_id' => $action_id ] );
	}

	/**
	 * 取消排程後，寫入 log
	 *
	 * @param int    $action_id 排程的 action_id
	 * @param string $group     排程的群組
	 * @return void
	 */
	public function after_unschedule( int $action_id, string $group ): void {
		Plugin::logger( "訂閱 #{$this->item->get_id()} 成功，取消排程停用網站", 'info', [ 'action_id' => $action_id ] );
	}

	/**
	 * 取得排程的 hook
	 *
	 * @return string
	 */
	public static function get_hook(): string {
		return self::$hook;
	}
}
