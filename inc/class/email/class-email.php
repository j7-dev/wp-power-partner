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

	/**
	 * Get emails
	 *
	 * @param string $action_name Action name 'subscription_failed' | 'subscription_success' | 'site_sync'
	 * @return array
	 */
	public static function get_emails( string $action_name = '' ): array {
		$emails = \get_option( self::EMAILS_OPTION_NAME, array() );

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
}
