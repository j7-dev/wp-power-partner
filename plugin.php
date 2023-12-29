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
use J7\PowerPartner\SiteSync;

\add_action('plugins_loaded', __NAMESPACE__ . '\check_dependency');
function check_dependency()
{
    if (!class_exists('WooCommerce', false)) {
        \add_action('admin_notices', __NAMESPACE__ . '\dependency_notice');
    } else {
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

class Bootstrap
{
    const APP_NAME = 'Power Partner';
    const KEBAB    = 'power-partner';
    const SNAKE    = 'power_partner';

    const ORDER_META_KEY = 'pp_create_site_responses';
    public function __construct()
    {
        \add_action('add_meta_boxes', [ $this, 'add_metabox' ]);
        \add_action("save_post", [ $this, "save_metabox" ]);
        \add_action('woocommerce_order_status_completed', [ $this, 'do_site_sync' ]);
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

    public function do_site_sync($order_id): void
    {

        $order     = wc_get_order($order_id);
        $items     = $order->get_items();
        $responses = [  ];
        foreach ($items as $item) {
            $product_id     = $item->get_product_id();
            $linked_site_id = \get_post_meta($product_id, 'linked_site', true);
            if (empty($linked_site_id)) {
                continue;
            }
            $responseObj   = SiteSync::fetch((int) $linked_site_id);
            $responses[  ] = [
                'status'  => $responseObj->status,
                'message' => $responseObj->message,
                'data'    => $responseObj->data,
             ];

        }
        ob_start();
        print_r($responses);
        $responses_string = ob_get_clean();
        // 把網站建立成功與否的資訊存到訂單的 meta data

        $order->add_order_note($responses_string);

        $order->update_meta_data(self::ORDER_META_KEY, json_encode($responses));

        $order->save();
    }

}

new Bootstrap();
