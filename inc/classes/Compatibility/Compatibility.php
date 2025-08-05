<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Compatibility;

use J7\PowerPartner\Plugin;


/** Class Compatibility 不同版本間的相容性設定 */
final class Compatibility {
	use \J7\WpUtils\Traits\SingletonTrait;

	const AS_COMPATIBILITY_ACTION = 'power_partner_compatibility_scheduler';
	const OPTION_NAME             = 'power_partner_compatibility_scheduled';

	/** Constructor */
	public function __construct() {
		$scheduled_version = \get_option(self::OPTION_NAME);
		if ($scheduled_version === Plugin::$version) {
			return;
		}

		\delete_option(self::OPTION_NAME);

		// 升級成功後執行
		\add_action( 'upgrader_process_complete', [ __CLASS__, 'compatibility' ]);

		// 排程只執行一次的兼容設定
		\add_action( 'init', [ __CLASS__, 'compatibility_action_scheduler' ] );
		\add_action( self::AS_COMPATIBILITY_ACTION, [ __CLASS__, 'compatibility' ]);
	}


	/**
	 * 排程只執行一次的兼容設定
	 *
	 * @return void
	 */
	public static function compatibility_action_scheduler(): void {
		\as_enqueue_async_action( self::AS_COMPATIBILITY_ACTION, [] );
	}


	/**
	 * 執行排程
	 *
	 * @return void
	 */
	public static function compatibility(): void {
		/**
		 * ============== START 相容性代碼 ==============
		 */

		$previous_version = \get_option(self::OPTION_NAME, '0.0.1');

		// 3.1.0 之前版本要取消 email schedule 跟 cron 的排程
		if (version_compare($previous_version, '3.1.0', '<=')) {
			self::cancel_email_schedule();
		}

		/**
		 * ============== END 相容性代碼 ==============
		 */

		// ❗不要刪除此行，註記已經執行過相容設定
		\update_option(self::OPTION_NAME, Plugin::$version);
		\wp_cache_flush();
		Plugin::log(Plugin::$version . ' 已執行兼容性設定', 'info');
	}

	/**
	 * 取消 email schedule 跟 cron 的排程
	 *
	 * @return void
	 */
	private static function cancel_email_schedule(): void {
		$hook = 'power_partner_daily_check';
		// 檢查是否已經有排程任務
		if (\as_has_scheduled_action($hook)) {
			// 已排程就取消
			\as_unschedule_all_actions($hook);
		}
	}
}
