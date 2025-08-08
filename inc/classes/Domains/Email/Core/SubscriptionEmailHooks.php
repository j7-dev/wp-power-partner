<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Core;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Domains\Email\DTOs\Email;
use J7\PowerPartner\Domains\Email\Models\SubscriptionEmail;
use J7\PowerPartner\Domains\Subscription\Utils\Base as SubscriptionUtils;
use J7\PowerPartner\Domains\Email\Services\SubscriptionEmailScheduler;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;
use J7\Powerhouse\Domains\Subscription\Utils\Base as PowerhouseSubscriptionUtils;


/**
 * SubscriptionEmailHooks
 * 需要用 $is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true ); 判斷是否為開站訂閱
 *  */
final class SubscriptionEmailHooks {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** @var object{subject:string, body:string} $default Default email */
	public object $default;

	/** @var array<Email> $emails Emails */
	public array $emails;

	/** Constructor */
	public function __construct() {

		$power_partner_settings = \get_option('power_partner_settings', []);
		$emails_array           = is_array($power_partner_settings['emails']) ? $power_partner_settings['emails'] : [];

		$this->emails = [];
		foreach ($emails_array as $email_data) {
			$this->emails[] = Email::create($email_data);
		}

		$this->default = (object) [
			'subject' => '這裡填你的信件主旨 ##FIRST_NAME##',
			'body'    => Plugin::DEFAULT_EMAIL_BODY,
		];

		SubscriptionEmailScheduler::register();

		// 網站訂閱創建後
		\add_action('pp_site_sync_by_subscription', [ $this, 'schedule_site_sync_email' ], 10, 1);

		// 以下六個時機點，用監聽的 hook 來發信，且只發一次，如果有修改要取消排程，重新排程
		$mapper = [
			Action::TRIAL_END->value          => Action::WATCH_TRIAL_END,
			Action::WATCH_TRIAL_END->value    => Action::WATCH_TRIAL_END,
			Action::END->value                => Action::WATCH_END,
			Action::WATCH_END->value          => Action::WATCH_END,
			Action::NEXT_PAYMENT->value       => Action::WATCH_NEXT_PAYMENT,
			Action::WATCH_NEXT_PAYMENT->value => Action::WATCH_NEXT_PAYMENT,
		];

		// 取得訂閱生命週期勾點
		foreach (Action::cases() as $action) {

			if (isset($mapper[ $action->value ])) {
				\add_action(
					$mapper[ $action->value ]->get_action_hook(),
					function ( $subscription, $args ) use ( $action ) {
						$this->schedule_subscription_email_once($subscription, $args, $action);
					},
				10,
				2
				);

				continue;
			}

			\add_action(
				$action->get_action_hook(),
					function ( $subscription, $args ) use ( $action ) {
						$this->schedule_subscription_email($subscription, $args, $action);
					},
					10,
					2
				);

		}

		\add_action(Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [ $this, 'unschedule_email' ], 10, 2);
	}

	/**
	 * Get email by key
	 *
	 * @param string $key 唯一 key
	 * @return Email|null
	 */
	public function get_email( string $key ): Email|null {
		foreach ($this->emails as $email) {
			if ($email->key === $key) {
				return $email;
			}
		}
		return null;
	}

	/**
	 * Get emails
	 * 預設只拿 enabled 的 email
	 *
	 * @param Action::value $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array<Email>
	 */
	public function get_emails( string $action_name = '' ): array {

		$enabled_emails = [];

		// 預設只拿 enabled 的 email
		foreach ($this->emails as $email) {
			if (!\wc_string_to_bool($email->enabled)) {
				continue;
			}

			if (! $action_name) {
				$enabled_emails[] = $email;
				continue;
			}

			if ($email->action_name === $action_name) {
				$enabled_emails[] = $email;
			}
		}

		return $enabled_emails;
	}

	/**
	 * 訂閱生命週期發信，只發一次
	 * 如果修改，就要重新排程
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @param array            $args 參數
	 * @param Action           $action 動作
	 * @return void
	 */
	public function schedule_subscription_email_once( \WC_Subscription $subscription, array $args, Action $action ) {
		$emails = $this->get_emails($action->value);

		foreach ($emails as $email) {
			$this->schedule_email($email, $subscription, $email->action_name);
		}
	}

	/**
	 * 訂閱生命週期發信
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @param array            $args 參數
	 * @param Action           $action 動作
	 * @return void
	 */
	public function schedule_subscription_email( \WC_Subscription $subscription, array $args, Action $action ) {
		$emails = $this->get_emails($action->value);

		foreach ($emails as $email) {
			$this->schedule_email($email, $subscription, $email->action_name);
		}
	}

	/**
	 * 網站訂閱創建後發信
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return void
	 */
	public function schedule_site_sync_email( $subscription ) {
		$emails = $this->get_emails('site_sync');
		foreach ($emails as $email) {
			$this->schedule_email($email, $subscription, 'site_sync');
		}
	}


	/**
	 * 取消排程寄信
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @param array            $args 參數
	 * @return void
	 */
	public function unschedule_email( \WC_Subscription $subscription, $args ) {
		$unschedule_actions = [
			Action::SUBSCRIPTION_FAILED,
			Action::END,
			Action::END_OF_PREPAID_TERM,
		];
		$emails             = [];
		foreach ($unschedule_actions as $action) {
			$emails = array_merge($emails, $this->get_emails($action->value));
		}

		foreach ($emails as $email) {
			$subscription_email           = new SubscriptionEmail($email, $subscription);
			$subscription_email_scheduler = new SubscriptionEmailScheduler($subscription_email);
			$subscription_email_scheduler->unschedule();
		}
	}


	/**
	 * 排程寄信
	 *
	 * @param Email            $email 信件
	 * @param \WC_Subscription $subscription 訂閱
	 * @param string           $type 類型
	 * @return void
	 */
	private function schedule_email( Email $email, \WC_Subscription $subscription, string $type = '' ): void {
		if (!SubscriptionUtils::is_site_sync($subscription)) {
			return;
		}

		$last_order = PowerhouseSubscriptionUtils::get_last_order($subscription);
		if (!$last_order) {
			return;
		}

		$subscription_email           = new SubscriptionEmail($email, $subscription);
		$subscription_email_scheduler = new SubscriptionEmailScheduler($subscription_email);
		$subscription_email_scheduler->maybe_unschedule('', $email->unique);
		$subscription_email_scheduler->schedule_single($subscription_email->get_timestamp(), '');
	}
}
