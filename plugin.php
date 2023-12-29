<?php

/**
 * Plugin Name:       Power Partner | 讓每個人都可以輕鬆地販售網站模板
 * Plugin URI:        https://cloud.luke.cafe/plugins/power-partner/
 * Description:       Power Partner 是一個 WordPress 套件，安裝後，可以讓你的 Woocommerce 商品與 cloud.luke.cafe 的模板網站連結，並且可以讓使用者自訂商品的價格，當用戶在您的網站下單後，會自動在 cloud.luke.cafe 創建網站，並且自動發送通知給用戶跟您。
 * Version:           0.1.0
 * Requires at least: 5.7
 * Requires PHP:      7.4
 * Author:            J7
 * Author URI:        https://github.com/j7-dev
 * License:           GPL v2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       power-partner-server
 * Domain Path:       /languages
 * Tags: WPCD
 */
declare (strict_types = 1);
namespace J7\PowerPartner;

\add_action('plugins_loaded', __NAMESPACE__ . '\check_dependency');
function check_dependency()
{
    if (!class_exists('WooCommerce', false)) {
        \add_action('admin_notices', __NAMESPACE__ . '\dependency_notice');
    } else {
        require_once __DIR__ . '/utils/index.php';
        require_once __DIR__ . '/class/index.php';
        require_once __DIR__ . '/components/index.php';
        new Bootstrap();
    }
}

// 顯示 WooCommerce 未安裝的通知
function dependency_notice(): void
{
    ?>
		<div class="notice notice-error is-dismissible">
			<p>使用 Power Partner 外掛必須先安裝並啟用 <a href="https://tw.wordpress.org/plugins/woocommerce/" target="_blank">Woocommerce</a> ，請先安裝並啟用 <a href="https://tw.wordpress.org/plugins/woocommerce/" target="_blank">Woocommerce</a></p>
		</div>
<?php
}
