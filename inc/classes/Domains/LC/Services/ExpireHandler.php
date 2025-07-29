<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\LC\Services;

use J7\Powerhouse\Domains\AsSchedulerHandler\Shared\Base;

/**
 * LC 生命週期
 *
 * Status:
 * active 已啟用
 * cancelled 已取消
 * expired 已過期
 * on-hold 保留
 * pending-cancel 待取消
 */
final class ExpireHandler extends Base {

	/** @var string 排程的 hook */
	protected static string $hook = 'power_partner/3.1.0/lc/expire';

	/** @var array<int|string> 授權碼 ids */
	private array $lc_ids = [];

	/** Constructor，每次傳入的資源實例可能不同 */
	public function __construct(
		/** @var \WC_Subscription 訂閱 */
		protected \WC_Subscription $item,
	) {
		parent::__construct( $item );
	}

	/**
	 * 取得排程的參數，執行時會傳入 action_callback
	 *
	 * @return array{lc_ids: array<int|string>, subscription_id: int}
	 * */
	protected function get_args(): array {
		$subscription    = $this->item;
		$subscription_id = $subscription->get_id();
		$lc_ids          = \get_post_meta($subscription_id, 'lc_id', false);
		$this->lc_ids    = is_array($lc_ids) ? $lc_ids : [];

		return [
			'lc_ids'          => $this->lc_ids,
			'subscription_id' => $subscription_id,
		];
	}

	/**
	 * 取得排程的 callback
	 *
	 * @param array<string, string> $args 排程的參數
	 * @return void
	 */
	public static function action_callback( $args ): void {
	}

	/**
	 * 單次排程
	 *
	 * @param int    $timestamp 排程的時間
	 * @param string $group     排程的群組
	 * @param string $unique    排程的唯一值
	 * @param int    $priority  排程的優先級
	 *
	 * @return int|null 排程的 action_id
	 */
	public function schedule_single( int $timestamp, string $group = '', string $unique = '', int $priority = 10 ): int|null {
		if ( ! $this->lc_ids ) {
			return null;
		}

		$action_id = parent::schedule_single( $timestamp, $group, $unique, $priority );
		if ( ! $action_id ) {
			// 失敗也不讓用戶知道他沒被停用
			return null;
		}

		$date = \wp_date('Y-m-d H:i', $timestamp);
		$this->item->add_order_note("已排程動作 #{$action_id}， 於 {$date} 停用授權碼");

		return $action_id;
	}

	/**
	 * 取消排程
	 *
	 * @return int|null 取消的排程 action_id
	 */
	public function unschedule(): int|null {
		$action_id = parent::unschedule();
		if ( ! $action_id ) {
			$this->item->add_order_note("排程動作 #{$action_id} 不存在，無法取消");
			return null;
		}
		$this->item->add_order_note("已取消排程動作 #{$action_id}");
		return $action_id;
	}
}
