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

		$strict = \wp_get_environment_type() === 'local';

		$this->emails = array_map( fn ( $email ) => new Email( $email, $strict ), $emails_array );

		$this->default = (object) [
			'subject' => '這裡填你的信件主旨 ##FIRST_NAME##',
			'body'    => Plugin::DEFAULT_EMAIL_BODY,
		];

		$this->action_names = (object) [
			'site_sync'               => 'site_sync',
			'subscription_failed'     => 'subscription_failed',
			'subscription_success'    => 'subscription_success',
			'last_order_date_created' => 'last_order_date_created',
			'date_created'            => 'date_created',
			'trial_end'               => 'trial_end',
			'next_payment'            => 'next_payment',
			'end'                     => 'end',
			'end_of_prepaid_term'     => 'end_of_prepaid_term',
		];
	}


	/**
	 * Get emails
	 * 預設只拿 enabled 的 email
	 *
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array
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
}
