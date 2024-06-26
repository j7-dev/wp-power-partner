<?php
/**
 * Email
 */

declare(strict_types=1);

namespace J7\PowerPartner\Email;

use J7\PowerPartner\Plugin;
/**
 * Class Email
 */
final class Email {

	const EMAILS_OPTION_NAME = Plugin::SNAKE . '_emails';
	const DEFAULT_SUBJECT    = '這裡填你的信件主旨 ##FIRST_NAME##';
	const DEFAULT_BODY       = '<p>嗨 ##FIRST_NAME##</p><p>你的網站開好囉，<a href="https://cloud.luke.cafe/docs" rel="noopener noreferrer" target="_blank">點此可以打開網站的使用說明書</a></p><p><br></p><p>另外如果要將網站換成正式的網域，請參考<a href="https://cloud.luke.cafe/docs/domain-change/" rel="noopener noreferrer" target="_blank">這篇教學</a></p><p><br></p><p>有網站的問題都可以直接回覆這封信，或是私訊 <a href="https://wpsite.pro/" rel="noopener noreferrer" target="_blank">架站小幫手網站</a> 的右下角對話框</p><p>&nbsp;</p><p>--- 以下是你的網站資訊 ---</p><p><br></p><p>網站暫時網址：</p><p>##FRONTURL##</p><p>之後可換成你自己的網址</p><p><br></p><p>網站後台：</p><p>##ADMINURL##</p><p><br></p><p>帳號：</p><p>##SITEUSERNAME##</p><p><br></p><p>密碼：</p><p>##SITEPASSWORD##</p><p><br></p><p><strong>進去後請記得改成自己的密碼喔</strong></p><p><br></p><br><p>網站主機ip：</p><p>##IPV4##</p><p>&nbsp;</p><p>這封信很重要，不要刪掉，這樣之後才找得到喔～</p><p>&nbsp;</p><p><br></p>';

	const SITE_SYNC_ACTION_NAME               = 'site_sync';
	const SUBSCRIPTION_FAILED_ACTION_NAME     = 'subscription_failed';
	const SUBSCRIPTION_SUCCESS_ACTION_NAME    = 'subscription_success';
	const LAST_ORDER_DATE_CREATED_ACTION_NAME = 'last_order_date_created';
	const DATE_CREATED_ACTION_NAME            = 'date_created';
	const TRIAL_END_ACTION_NAME               = 'trial_end';
	const NEXT_PAYMENT_ACTION_NAME            = 'next_payment';
	const END_ACTION_NAME                     = 'end';
	const END_OF_PREPAID_TERM_ACTION_NAME     = 'end_of_prepaid_term';




	/**
	 * Get emails
	 * 預設只拿 enabled 的 email
	 *
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array
	 */
	public static function get_emails( string $action_name = '' ): array {
		$emails = \get_option( self::EMAILS_OPTION_NAME, array() );

		// 預設只拿 enabled 的 email
		$emails = array_filter(
			$emails,
			function ( $email ) {
				return $email['enabled'] === true;
			}
		);
		if ( empty( $action_name ) ) {
			return $emails;
		}

		$emails = array_filter(
			$emails,
			function ( $email ) use ( $action_name ) {
				return ( $email['action_name'] === $action_name );
			}
		);
		return $emails;
	}

	/**
	 * Sync_email_content
	 * 因為v1與v2存的email的欄位不同，所以要做一次轉換
	 *
	 * @deprecated version 2.0.0
	 * @return void
	 */
	public static function sync_email_content() {
		$power_plugins_settings = \get_option( 'power_plugins_settings' );
		$origin_email_subject   = $power_plugins_settings['power_partner_email_subject'] ?? '';
		$origin_email_body      = $power_plugins_settings['power_partner_email_body'] ?? '';

		if ( ! empty( $origin_email_subject ) || ! empty( $origin_email_body ) ) {
			// 如果有舊的email，就同步舊有的email成新的email
			$sync_email = array(
				'enabled'     => true,
				'key'         => 'sync_email',
				'body'        => $origin_email_body,
				'subject'     => $origin_email_subject,
				'action_name' => 'site_sync',
				'days'        => 0,
				'operator'    => 'after',
			);
			\update_option(
				self::EMAILS_OPTION_NAME,
				array(
					$sync_email,
				)
			);

			// 同步完成，移除舊的email
			unset( $power_plugins_settings['power_partner_email_subject'] );
			unset( $power_plugins_settings['power_partner_email_body'] );
			\update_option( 'power_plugins_settings', $power_plugins_settings );
		}
	}
}
