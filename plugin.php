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
namespace J7\PowerPartner\Inc;

use J7\PowerPartner\Components\SiteSelector;

\add_action('plugins_loaded', __NAMESPACE__ . '\checkDependency');
function checkDependency()
{
    if (!class_exists('WooCommerce', false)) {
        \add_action('admin_notices', __NAMESPACE__ . '\dependencyNotice');
    } else {
        require_once __DIR__ . '/components/index.php';
        new Bootstrap();
    }
}

// 顯示 WooCommerce 未安裝的通知
function dependencyNotice(): void
{
    ?>
		<div class="notice notice-error is-dismissible">
			<p>使用 Power Partner 外掛必須先安裝並啟用 <a href="https://tw.wordpress.org/plugins/woocommerce/" target="_blank">Woocommerce</a> ，請先安裝並啟用 <a href="https://tw.wordpress.org/plugins/woocommerce/" target="_blank">Woocommerce</a></p>
		</div>
<?php
}

class Bootstrap
{
    const APP_NAME = 'Power Partner';
    const KEBAB    = 'power-partner';
    const SNAKE    = 'power_partner';
    public function __construct()
    {
        \add_action('add_meta_boxes', [ $this, 'add_metabox' ]);
        \add_action("save_post", [ $this, "save_metabox" ]);
    }

    public function add_metabox(): void
    {
        \add_meta_box(self::SNAKE . '_metabox', '選擇要連結的網站', [ $this, self::SNAKE . '_callback' ], 'product');
    }

    public function power_partner_callback(): void
    {
        $post_id = $_GET[ 'post' ];
        if (empty($post_id)) {
            return;
        }

        $siteSelector = SiteSelector::getInstance();
        $defaultValue = \get_post_meta($post_id, "linked_site", true) ?? null;
        echo $siteSelector->render($defaultValue);
    }

    public function save_metabox($post_id): void
    {
        $post_type = \get_post_type($post_id);

        if ('product' !== $post_type) {
            return;
        }

        $linked_site = $_POST[ 'linked_site' ] ?? null;
        \update_post_meta($post_id, "linked_site", $linked_site);
    }

}

new Bootstrap();
