<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Models;

use J7\PowerPartner\Domains\Email\DTOs\Email as EmailDTO;
use J7\Powerhouse\Domains\Subscription\DTOs\Times;


/**
 * Subscription Email Model
 *  */
class SubscriptionEmail extends EmailBase {

	/** @var Times $times 訂閱的各時間點 */
	private Times $times;

	/** Constructor */
	public function __construct(
		public EmailDTO $dto,
		public \WC_Subscription $subscription
	) {
		parent::__construct( $dto );
		$this->times = Times::instance( $subscription );
	}

	/** @return int timestamp 多久後，或多久前寄信 */
	public function get_timestamp(): int {
		$timestamp_shift = $this->get_timestamp_shift();

		// 如果是 Times 屬性，就 return 計算後的 timestamp
		// TRIAL_END, NEXT_PAYMENT, LAST_ORDER_DATE_CREATED, END, END_OF_PREPAID_TERM
		if (isset($this->times->{$this->dto->action_name})) {
			$action_timestamp = $this->times->{$this->dto->action_name};
			return $action_timestamp + $timestamp_shift;
		}

		// 以下條件都是 事件發生時才觸發，所以回傳 用當下時間 + 偏移量就好
		// SITE_SYNC, SUBSCRIPTION_FAILED, SUBSCRIPTION_SUCCESS, DATE_CREATED
		return time() + $timestamp_shift;
	}

	/**
	 * 取得排程的參數，執行時會傳入 action_callback
	 *
	 * @return array{email_key: string, subscription_id: int, action_name: string}
	 */
	public function get_scheduler_args(): array {
		return [
			'email_key'       => (string) $this->dto->key,
			'subscription_id' => (int) $this->subscription->get_id(),
			'action_name'     => (string) $this->dto->action_name,
		];
	}
}
