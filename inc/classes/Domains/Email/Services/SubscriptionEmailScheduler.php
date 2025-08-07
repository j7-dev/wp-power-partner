<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Services;

use J7\PowerPartner\Plugin;
use J7\Powerhouse\Domains\AsSchedulerHandler\Shared\Base;
use J7\PowerPartner\Domains\Email\Models\SubscriptionEmail;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Status;
use J7\PowerPartner\Utils\Token;
use J7\PowerPartner\Domains\Email\Core\SubscriptionEmailHooks;
use J7\Powerhouse\Domains\Subscription\Utils\Base as PowerhouseSubscriptionUtils;

/**
 * 排程寄信
 */
final class SubscriptionEmailScheduler extends Base {

	/** @var string 排程的 hook */
	protected static string $hook = 'power_partner_send_email';
	// protected static string $hook = 'power_partner/3.1.0/email/schedule';
	// 要改 hook 的話，db 也要一起改，把 所有排程的 hook 改掉

	/**
	 * Constructor，每次傳入的資源實例可能不同
	 *
	 * @param \SubscriptionEmail $item 訂閱
	 * @throws \Exception 如果 $item 不是 \WC_Subscription 實例
	 */
	public function __construct(
		/** @var SubscriptionEmail 訂閱Email */
		protected $item,
	) {
		if ( ! $item instanceof SubscriptionEmail ) {
			throw new \Exception('$item 不是 SubscriptionEmail 實例');
		}

		parent::__construct( $item );
	}

	/**
	 * 取得排程的參數，執行時會傳入 action_callback
	 *
	 * @return array{email_key: string, subscription_id: int, action_name: string}
	 * */
	protected function get_args(): array {
		return $this->item->get_scheduler_args();
	}

	/**
	 * 取得排程的 callback
	 *
	 * @param array{email_key: string, subscription_id: int, action_name: string} $args 排程的參數
	 * @return void
	 */
	public static function action_callback( $args ): void {

		$email_key       = $args['email_key'] ?? '';
		$subscription_id = $args['subscription_id'] ?? 0;
		$action_name     = $args['action_name'] ?? '';

		if (!$email_key || !$subscription_id) {
			Plugin::log(  'send_email 找不到 email_key 或 subscription_id', 'error', $args );
			return;
		}

		$service      = SubscriptionEmailHooks::instance();
		$email        = $service->get_email( $email_key );
		$subscription = \wcs_get_subscription( $subscription_id );
		if ( !$email || !$subscription ) {
			Plugin::log( 'send_email 找不到 email 或 subscription', 'error', $args );
			return;
		}

		// 檢查訂閱是否成功
		$subscription_status = $subscription->get_status();
		$status_enum         = Status::tryFrom( $subscription_status );
		$is_failed           = $status_enum?->is_failed() ?? true;
		// 如果訂閱失敗，除了續訂成功的信件不寄送以外，其他都寄
		if ( $is_failed && $email->action_name === Action::SUBSCRIPTION_SUCCESS->value ) {
			Plugin::log(
				"訂閱 #{$subscription->get_id()} 續訂失敗，不寄送續訂成功的信件",
				'info',
				[
					'subscription_status' => $subscription_status,
					'email'               => $email->to_array(),
				]
				);
			return;
		}

		$last_order = PowerhouseSubscriptionUtils::get_last_order( $subscription );
		if ( ! $last_order) {
			return;
		}

		$tokens = array_merge( Token::get_order_tokens( $last_order ), Token::get_subscription_tokens( $subscription ) );

		$admin_email = \get_option('admin_email');
		$headers     = [];
		$headers[]   = 'Content-Type: text/html; charset=UTF-8';
		$headers[]   = "Bcc: {$admin_email}";

		$success = \wp_mail(
			$last_order->get_billing_email(),
			Token::replace( $email->subject, $tokens ),
			Token::replace( $email->body, $tokens ),
			$headers,
		);

		$log_args = (object) [
			'sent_status' => $success ? '成功' : '失敗',
			'level'       => $success ? 'info' : 'error',
		];

		Plugin::log( "訂閱 #{$subscription->get_id()} 寄信{$log_args->sent_status} email_action {$email->action_name} email_key {$email->key}", $log_args->level, $args );
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
		Plugin::log( "訂閱 #{$this->item->subscription->get_id()} 排程寄信 action_name #{$this->item->dto->action_name} action_id #{$action_id}", 'info', $this->item->get_scheduler_args() );
	}

	/**
	 * 取消排程後，寫入 log
	 *
	 * @param int    $action_id 排程的 action_id
	 * @param string $group 排程的群組
	 * @return void
	 */
	public function after_unschedule( int $action_id, string $group ): void {
		Plugin::log( "訂閱 #{$this->item->subscription->get_id()} 取消排程寄信 action_name #{$this->item->dto->action_name} action_id #{$action_id}", 'debug', $this->item->get_scheduler_args() );
	}
}
