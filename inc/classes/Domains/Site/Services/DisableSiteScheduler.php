<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Site\Services;

use J7\PowerPartner\Plugin;
use J7\Powerhouse\Domains\AsSchedulerHandler\Shared\Base;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\ShopSubscription;

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
		// disable 訂單網站
		foreach ( $linked_site_ids as $site_id ) {
			$reason = "停用網站，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}，網站ID: {$site_id}";

			Fetch::disable_site( $site_id, $reason );
			$subscription->add_order_note( $reason );
			$subscription->save();
			Plugin::logger($reason);
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
