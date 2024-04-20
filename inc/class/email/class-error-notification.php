<?php
/**
 * Error Notification
 */

declare(strict_types=1);

namespace J7\PowerPartner\Email;

use J7\PowerPartner\Utils\Base;

/**
 * Class ErrorNotification
 */
final class ErrorNotification {

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'shutdown', array( $this, 'notify_on_fatal_error' ) );
	}

	/**
	 * Notify_on_fatal_error
	 *
	 * @return void
	 */
	public function notify_on_fatal_error(): void {
		$last_error = error_get_last();
		if ( $last_error && $last_error['type'] === E_ERROR ) {
			// 設定接收通知的電子郵件地址
			$site_name = \get_bloginfo( 'name' );
			$subject   = '🚩 經銷商網站出錯拉！ - ' . $site_name;
			$message   = "A fatal error occurred:\n\nError type: {$last_error['type']}\n\nError message: {$last_error['message']}\n\nFile: {$last_error['file']}\n\nLine: {$last_error['line']}";
			// 確保使用正確的郵件函數發送郵件
			Base::mail_to( $subject, $message );
		}
	}
}

new ErrorNotification();
