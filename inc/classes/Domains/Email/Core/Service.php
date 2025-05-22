<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Core;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Domains\Email\Model\Email;
use J7\PowerPartner\Utils\Token;
use J7\PowerPartner\ShopSubscription;
use J7\PowerPartner\Domains\Subscription\Model\Times;
use J7\PowerPartner\Domains\Subscription\Utils\Base as SubscriptionUtils;
use J7\PowerPartner\Product\SiteSync;

/**
 * Class Service
 * 需要用 $is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true ); 判斷是否為開站訂閱
 *  */
final class Service {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** @var object{subject:string, body:string} $default Default email */
	public object $default;

	/** @var object{
	 * site_sync:string,
	 * subscription_failed:string,
	 * subscription_success:string,
	 * last_order_date_created:string,
	 * date_created:string,
	 * trial_end:string,
	 * next_payment:string,
	 * end:string,
	 * end_of_prepaid_term:string,
	 * } $action_names Action names */
	public object $action_names;

	/** @var array<Email> $emails Emails */
	public array $emails;

	/** @var string 執行 send email 的 action name */
	const EXEC_SEND = 'power_partner_send_email';


	/** Constructor */
	public function __construct() {

		$power_partner_settings = \get_option( 'power_partner_settings', [] );
		$emails_array           = is_array( $power_partner_settings['emails'] ) ? $power_partner_settings['emails'] : [];

		$strict       = \wp_get_environment_type() === 'local';
		$this->emails = Email::parse_array( $emails_array, $strict );

		$this->default = (object) [
			'subject' => '這裡填你的信件主旨 ##FIRST_NAME##',
			'body'    => Plugin::DEFAULT_EMAIL_BODY,
		];

		$this->action_names = (object) self::get_action_names();

		// 訂閱創建時
		\add_action('pp_site_sync_by_subscription', [ $this, 'subscription_created' ], 10, 1 );

		// 狀態改變時檢查
		\add_action( 'woocommerce_subscription_status_updated', [ $this, 'subscription_status_changed' ], 10, 3 );

		// 訂閱付款成功寄信
		\add_action( 'woocommerce_subscription_payment_complete', [ $this, 'subscription_payment_complete' ], 10, 1 );

		// 訂閱付款失敗寄信
		\add_action( 'woocommerce_subscription_payment_failed', [ $this, 'subscription_payment_failed' ], 10, 2 );

		// 執行寄信的動作
		\add_action( self::EXEC_SEND, [ $this, 'exec_send_email' ], 10, 4 );
	}

	/** @return array<string,string> Action names */
	public static function get_action_names(): array {
		return [
			'site_sync'               => 'site_sync', // 下單開站後
			'subscription_failed'     => 'subscription_failed', // 續訂失敗後
			'subscription_success'    => 'subscription_success', // 續訂成功後
			'last_order_date_created' => 'last_order_date_created', // 上次續訂訂單日期後
			'date_created'            => 'date_created', // 訂閱成立後
			'trial_end'               => 'trial_end', // 試用結束前|後
			'next_payment'            => 'next_payment', // 下次付款前|後
			'end'                     => 'end', // 訂閱結束
			'end_of_prepaid_term'     => 'end_of_prepaid_term', // 訂閱結束
		];
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
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array<Email>
	 */
	public function get_emails( string $action_name = '' ): array {

		$enabled_emails = [];

		// 預設只拿 enabled 的 email
		foreach ( $this->emails as $email ) {
			if ( !\wc_string_to_bool( $email->enabled ) ) {
				continue;
			}

			if ( ! $action_name ) {
				$enabled_emails[] = $email;
				continue;
			}

			if ( $email->action_name === $action_name ) {
				$enabled_emails[] = $email;
			}
		}

		return $enabled_emails;
	}

	/**
	 * Subscription created
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return void
	 */
	public function subscription_created( $subscription ) {
		$emails = $this->get_emails($this->action_names->date_created);
		foreach ( $emails as $email ) {
			$this->handle_email( $email, $subscription);
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
		$times  = Times::instance( $subscription );
		$emails = $this->get_emails();
		foreach ( $emails as $email ) {
			$map_time = $email->action_name;
			if (!property_exists($times, $map_time)) {
				// 例如 site_sync, subscription_success, subscription_failed 這些動作  不在 times 屬性裡面，就什麼也不做
				continue;
			}

			// 如果時間戳記是 0，代表待訂閱不會發生那個動作，不寄信
			if (!$times->{$map_time}) {
				continue;
			}

			$this->handle_email( $email, $subscription, '', $times->{$map_time});
		}

		if (in_array($to_status, ShopSubscription::$failed_statuses, true)) {
			SubscriptionUtils::disable_sites( $subscription->get_id() );
		}
	}

	/**
	 * Subscription payment complete
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return void
	 */
	public function subscription_payment_complete( $subscription ): void {
		$emails = $this->get_emails( $this->action_names->subscription_success );
		foreach ( $emails as $email ) {
			$this->handle_email( $email, $subscription, 'success' );
		}
	}

	/**
	 * Subscription payment failed
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @param string           $new_status 新狀態
	 * @return void
	 */
	public function subscription_payment_failed( $subscription, $new_status ): void {
		$emails = $this->get_emails( $this->action_names->subscription_failed );
		foreach ( $emails as $email ) {
			$this->handle_email( $email, $subscription, 'failed' );
		}
	}

	/**
	 * 處理寄信
	 *
	 * @param Email            $email 信件
	 * @param \WC_Subscription $subscription 訂閱
	 * @param string           $type 類型
	 * @param int|null         $timestamp 時間戳記
	 * @return void
	 */
	private function handle_email( Email $email, \WC_Subscription $subscription, string $type = '', $timestamp = null ): void {
		$is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true );

		if (!$is_power_partner_subscription) {
			return;
		}

		$last_order = SubscriptionUtils::get_last_order( $subscription );
		if (!$last_order) {
			return;
		}

		$args = [
			'email_key'       => (string) $email->key,
			'subscription_id' => (int) $subscription->get_id(),
			'action_name'     => (string) $email->action_name,
		];

		$group = "{$email->key}_{$email->action_name}_{$args['subscription_id']}";

		/**
		 * 訂閱成功、訂閱失敗、last_order_date_created 才需要比對
		 * last_order_id 來判斷是否寄信過
		 */
		if (in_array(
			$email->action_name,
			[
				$this->action_names->subscription_success,
				$this->action_names->subscription_failed,
				$this->action_names->last_order_date_created,
			],
			true
			)) {
			$group .= "_{$last_order->get_id()}";
		}

		// $group 就類似唯一的 key 確認是否已經寄信過
		$scheduled_actions = \as_get_scheduled_actions(
			[
				'hook'  => self::EXEC_SEND,
				'group' => $group,
			],
			'ids'
			);
		$is_scheduled      = (bool) $scheduled_actions;
		if ( $is_scheduled ) {
			$context                      = $args;
			$context['scheduled_actions'] = $scheduled_actions;
			Plugin::log( "訂閱 #{$subscription->get_id()} 已經排程或已寄信過，不重複排程", 'warning', $context );
			return;
		}

		if (!$email->days) {
			$action_id = \as_enqueue_async_action(
				self::EXEC_SEND,
				$args,
				$group
				);
			Plugin::log( "訂閱 #{$subscription->get_id()} async 排程寄信 action_id #{$action_id}", 'info', $args );
			return;
		}

		$send_timestamp = ( null === $timestamp ) ? time() + $email->get_timestamp() : $timestamp + $email->get_timestamp();

		$action_id = \as_schedule_single_action(
			$send_timestamp,
			self::EXEC_SEND,
			$args,
			$group
			);

		$type_label = match ( $type ) {
			'success' => '付款成功',
			'failed'  => '付款失敗',
			default   => '',
		};
		Plugin::log( "訂閱 {$type_label} #{$subscription->get_id()} 排程寄信 action_id #{$action_id}", 'info', $args );
	}

	/**
	 * 執行 Send email
	 * 只要提供 email_key 和 subscription_id 即可
	 *
	 * @param string $email_key 信件 key
	 * @param int    $subscription_id 訂閱 id
	 * @param string $action_name 動作名稱
	 * @return void
	 */
	public function exec_send_email( string $email_key, int $subscription_id, string $action_name ) {

		$args = [
			'email_key'       => $email_key,
			'subscription_id' => $subscription_id,
			'action_name'     => $action_name,
		];

		if (!$email_key || !$subscription_id) {
			Plugin::log(  'send_email 找不到 email_key 或 subscription_id', 'error', $args );
			return;
		}

		$email        = $this->get_email( $email_key );
		$subscription = \wcs_get_subscription( $subscription_id );
		if ( !$email || !$subscription ) {
			Plugin::log( 'send_email 找不到 email 或 subscription', 'error', $args );
			return;
		}

		// 檢查訂閱是否成功
		$subscription_status = $subscription->get_status();
		$is_failed           = in_array( $subscription_status, ShopSubscription::$failed_statuses, true );
		// 如果訂閱失敗，除了續訂成功的信件不寄送以外，其他都寄
		if ( $is_failed && $email->action_name === $this->action_names->subscription_success ) {
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

		$last_order = SubscriptionUtils::get_last_order( $subscription );
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

		$success_label = $success ? '成功' : '失敗';

		Plugin::log( "訂閱 #{$subscription->get_id()} 寄信{$success_label} email_action {$email->action_name} email_key {$email->key}", 'info', $args );
	}
}
