<?php

declare(strict_types=1);

namespace J7\PowerPartner\Email\Core;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Email\Model\Email;
/** Class Init */
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

		\add_action( 'woocommerce_subscription_pre_update_status', [ $this, 'subscription_status_changed' ], 10, 3 );
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
			'end'                     => 'end', // TODO: 可能沒用到?
			'end_of_prepaid_term'     => 'end_of_prepaid_term', // TODO: 可能沒用到?
		];
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
	 * Subscription failed
	 * 如果用戶續訂失敗，則停用訂單網站
	 *
	 * @param string           $old_status old status
	 * @param string           $new_status new status
	 * @param \WC_Subscription $subscription post
	 * @return void
	 */
	public function subscription_status_changed( $old_status, $new_status, $subscription ): void {
		// WIP: 依照訂閱狀態發送 email
		// TEST 印出 WC Logger 記得移除 ---- //
		\J7\WpUtils\Classes\WC::log(
			[
				'old_status' => $old_status,
				'new_status' => $new_status,
			],
			'subscription_status_changed'
			);
		// ---------- END TEST ---------- //
	}
}
