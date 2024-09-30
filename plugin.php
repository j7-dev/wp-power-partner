<?php
/**
 * Plugin Name:       Power Partner | 讓每個人都可以輕鬆地販售網站模板
 * Plugin URI:        https://cloud.luke.cafe/plugins/power-partner/
 * Description:       Power Partner 是一個 WordPress 套件，安裝後，可以讓你的 Woocommerce 商品與 cloud.luke.cafe 的模板網站連結，並且可以讓使用者自訂商品的價格，當用戶在您的網站下單後，會自動在 cloud.luke.cafe 創建網站，並且自動發送通知給用戶跟您。
 * Version:           3.0.1
 * Requires at least: 5.7
 * Requires PHP:      8.0
 * Author:            J7
 * Author URI:        https://github.com/j7-dev
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       power_partner
 * Domain Path:       /languages
 * Tags: WPCD
 */

declare (strict_types = 1);

namespace J7\PowerPartner;

if ( \class_exists( 'J7\PowerPartner\Plugin' ) ) {
	return;
}

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Class Plugin
 */
final class Plugin {
	use \J7\WpUtils\Traits\PluginTrait;
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {

		$this->required_plugins = [
			[
				'name'     => 'Powerhouse',
				'slug'     => 'powerhouse',
				'source'   => 'https://github.com/j7-dev/wp-powerhouse/releases/latest/download/powerhouse.zip',
				'version'  => '2.0.0',
				'required' => true,
			],
			[
				'name'     => 'WooCommerce',
				'slug'     => 'woocommerce',
				'required' => true,
				'version'  => '7.6.0',
			],
			[
				'name'     => 'Woo Subscriptions',
				'slug'     => 'woocommerce-subscriptions',
				// 'source'   => '',
				'required' => true,
				'version'  => '5.9.0',
			],
		];

		$this->init(
			[
				'app_name'         => 'Power Partner',
				'github_repo'      => 'https://github.com/j7-dev/wp-power-partner',
				'callback'         => [ Bootstrap::class, 'instance' ],
				'lc'               => false,
				'submenu_callback' => [ Admin\Menu\Setting::class, 'render_page' ],
			]
		);
	}



	/**
	 * Deactivate
	 *
	 * @return void
	 */
	public function deactivate(): void {
		$cron_hooks = [
			Cron::SEND_EMAIL_HOOK_NAME,
			Cron::SYNC_SUBSCRIPTION_META_HOOK_NAME,
		];

		foreach ($cron_hooks as $cron_hook) {
			$timestamp = \wp_next_scheduled($cron_hook);

			if ($timestamp !== false) {
				// 如果找到了cron任務,就清除它
				\wp_clear_scheduled_hook($cron_hook);
			}
		}
	}
}

Plugin::instance();
