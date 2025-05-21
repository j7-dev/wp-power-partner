<?php
/**
 * Error Notification
 * 🚩 暫停啟用此功能
 */

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Core;

use J7\PowerPartner\Utils\Base;

/**
 * Class ErrorNotification
 */
final class ErrorNotification {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'shutdown', [ $this, 'notify_on_fatal_error' ] );
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
			$subject   = '🚩 經銷商網站出錯拉！ - ' . $site_name . ' | ' . site_url();
			$message   = 'A fatal error occurred: <br><br>';
			$message  .= "Error type: {$last_error['type']}<br><br>";
			$message  .= "Error message: {$last_error['message']}<br><br>";
			$message  .= "File: {$last_error['file']}<br><br>";
			$message  .= "Line: {$last_error['line']}<br><br>";

			// 確保使用正確的郵件函數發送郵件
			Base::mail_to( $subject, $message );
		}
	}
}
