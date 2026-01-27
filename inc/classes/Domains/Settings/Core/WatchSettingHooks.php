<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Settings\Core;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Domains\Site\Services\DisableSiteScheduler;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;
use J7\PowerPartner\Domains\Email\Services\SubscriptionEmailScheduler;
use J7\PowerPartner\Domains\Site\Core\DisableHooks;


/**
 * WatchSettingHooks
 * 監聽 settings api 的更新
 * 如果有日期、Email 的更新
 * 重新排程
 *  */
final class WatchSettingHooks {
	use \J7\WpUtils\Traits\SingletonTrait;

	const HOOK = 'reschedule_emails';

	/** Constructor */
	public function __construct() {
		\add_action('update_option_power_partner_settings', [ $this, 'reschedule_disable_site' ], 10, 3);

		\add_action('update_option_power_partner_settings', [ $this, 'reschedule_emails' ], 10, 3);

		\add_action(self::HOOK, [ __CLASS__, 'reschedule_emails' ], 10, 0);
	}

	/**
	 * 重新排程禁用網站
	 *
	 * @param array<string, mixed> $old_value 舊的設定值
	 * @param array<string, mixed> $value 新的設定值
	 * @param string               $option 設定選項
	 * @return void
	 */
	public function reschedule_disable_site( $old_value, $value, $option ) {
		$old_disable_site_after_n_days = $old_value['power_partner_disable_site_after_n_days'] ?? 7;
		$new_disable_site_after_n_days = $value['power_partner_disable_site_after_n_days'] ?? 7;

		if ($old_disable_site_after_n_days === $new_disable_site_after_n_days) {
			return;
		}

		if (!is_numeric($old_disable_site_after_n_days) || !is_numeric($new_disable_site_after_n_days)) {
			return;
		}

		global $wpdb;

		try {
			$wpdb->query('START TRANSACTION');

			/** @var \ActionScheduler_DBStore $store */
			$store      = \ActionScheduler::store();
			$action_ids = $store->query_actions(
			[
				'hook'   => DisableSiteScheduler::get_hook(),
				'status' => \ActionScheduler_Store::STATUS_PENDING,
			]
			);

			foreach ($action_ids as $action_id) {
				$action          = $store->fetch_action($action_id);
				$subscription_id = $action->get_args()[0]['subscription_id'] ?? null;
				if (!$subscription_id) {
					continue;
				}

				$subscription = \wcs_get_subscription($subscription_id);
				if (!$subscription) {
					continue;
				}
				DisableHooks::instance()->schedule_disable_site($subscription, []);
			}
			$wpdb->query('COMMIT');

		} catch (\Throwable $th) {
			$wpdb->query('ROLLBACK');
			Plugin::logger(
				'ROLLBACK 重新排程關站失敗: ',
				'error',
				[
					'error' => $th->getMessage(),
				],
				5
				);
		}
	}

	/**
	 * 檢查 Email 是否改變
	 *
	 * @param array<string, mixed> $old_value 舊的設定值
	 * @param array<string, mixed> $value 新的設定值
	 * @return bool
	 */
	private function is_changed( $old_value, $value ): bool {
		$old_emails = $this->format_emails($old_value);
		$new_emails = $this->format_emails($value);

		return $old_emails !== $new_emails;
	}

	/**
	 * 檢查 Email 是否是可以提前排程的 action
	 *
	 * @param array<string, mixed> $email 郵件
	 * @return bool
	 */
	private function is_in_schedule_actions( array $email ): bool {
		$actions = [
			Action::TRIAL_END->value,
			Action::WATCH_TRIAL_END->value,
			Action::NEXT_PAYMENT->value,
			Action::WATCH_NEXT_PAYMENT->value,
			Action::END->value,
			Action::WATCH_END->value,
		];

		return in_array($email['action_name'], $actions, true);
	}

	/**
	 * 格式化 emails
	 *
	 * @param array<string, mixed> $value 設定值
	 * @return array<string, mixed>
	 */
	private function format_emails( array $value ): array {
		$emails           = $value['emails'] ?? [];
		$formatted_emails = [];
		foreach ($emails as $email) {
			if (!$this->is_in_schedule_actions($email)) {
				continue;
			}

			unset($email['body']);
			unset($email['subject']);
			$formatted_emails[] = [
				'email' => $email,
				'type'  => 'site_sync',
			];
		}
		return $formatted_emails;
	}


	/**
	 * 重新排程所有訂閱的 email 排程
	 *
	 * @param string $unschedule_hook 要刪除的排程 hook
	 * @return void
	 */
	public static function reschedule_all_subscription_email( string $unschedule_hook = '' ): void {
		$unschedule_hook = $unschedule_hook ?: SubscriptionEmailScheduler::get_hook();

		global $wpdb;

		try {
			// START TRANSACTION
			$wpdb->query('START TRANSACTION');

			// 0. 先刪除原本所有排程
			\as_unschedule_all_actions($unschedule_hook);

			// 1. 取得所有[已啟用]  next_payment > current_time 的訂閱，然後重新排程 next_payment
			$next_payment_subscriptions = self::get_subscriptions();
			foreach ($next_payment_subscriptions as $subscription) {
				\do_action(
				Action::WATCH_NEXT_PAYMENT->get_action_hook(),
				$subscription,
				[
					'datetime' => $subscription->get_date( 'next_payment' ),
				]
					);
			}

			// 2. 取得所有[已啟用][保留][待取消] trial_end > current_time 的訂閱，然後重新排程 trial_end
			$trial_end_subscriptions = self::get_subscriptions( '_schedule_trial_end');
			foreach ($trial_end_subscriptions as $subscription) {
				\do_action(
				Action::WATCH_TRIAL_END->get_action_hook(),
				$subscription,
				[
					'datetime' => $subscription->get_date( 'trial_end' ),
				]
					);
			}

			// 3. 取得所有[已啟用][保留][待取消] end > current_time 的訂閱，然後重新排程 end
			$end_subscriptions = self::get_subscriptions( '_schedule_end');
			foreach ($end_subscriptions as $subscription) {
				\do_action(
				Action::WATCH_END->get_action_hook(),
				$subscription,
				[
					'datetime' => $subscription->get_date( 'end' ),
				]
					);
			}

			$wpdb->query('COMMIT');

		} catch (\Throwable $th) {
			$wpdb->query('ROLLBACK');
			Plugin::logger('ROLLBACK 重新排程 EMAILS 失敗: ', $th->getMessage(), 'critical', [], 5);
		}
	}


	/**
	 * 重新排程其他 Email
	 *
	 * @param array<string, mixed> $old_value 舊的設定值
	 * @param array<string, mixed> $value 新的設定值
	 * @param string               $option 設定選項
	 * @return void
	 */
	public function reschedule_emails( $old_value, $value, $option ) {
		if (!$this->is_changed($old_value, $value)) {
			return;
		}

		\as_enqueue_async_action(
			self::HOOK,
			[],
			'',
			);
	}


	/**
	 * 取得所有訂閱
	 *
	 * @param string        $key_exist 要檢查的 meta key
	 * @param array<string> $status 訂閱狀態
	 * @return \WC_Subscription[] 訂閱列表
	 */
	private static function get_subscriptions( $key_exist = '_schedule_next_payment', $status = [ 'active', 'on-hold', 'pending-cancel' ] ): array {
		$subscriptions = \wcs_get_subscriptions(
			[
				'subscription_status' => $status,
				'limit'               => -1,
				'orderby'             => 'date',
				'order'               => 'ASC',
				'meta_query'          => [
					[
						'key'     => $key_exist,
						'value'   => \current_time('Y-m-d H:i:s'),
						'compare' => '>',
						'type'    => 'DATETIME',
					],

				],
			]
			);

		return $subscriptions;
	}
}
