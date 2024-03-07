<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Components\SiteSelector;
use J7\PowerPartner\Product\Attributes;

require_once __DIR__ . '/attributes.php';

/**
 * 新增 product tab 當商品類型為可變訂閱時
 */
final class Product
{
    const PRODUCT_TYPE_SLUG = Utils::SNAKE;
    const PRODUCT_TYPE_NAME = Utils::APP_NAME . ' 產品';

    public function __construct()
    {
        \add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        \add_filter('woocommerce_product_data_tabs', array($this, 'add_product_tab'), 50, 1);
        \add_action('woocommerce_product_data_panels', array($this, 'add_product_tab_content'));
        \add_action('woocommerce_process_product_meta', array($this, 'save_product_tab_content'));

        // \add_action('woocommerce_order_status_completed', [ $this, 'do_site_sync' ]);
        // \add_action('admin_init', [ $this, 'do_site_sync_test' ]);
    }

    public function enqueue_assets()
    {
        $screen = \get_current_screen();
        if ($screen->id !== 'product') {
            return;
        }
        \wp_enqueue_style(Utils::KEBAB . '-css', Utils::get_plugin_url() . '/js/dist/assets/css/index.css', [  ], Utils::get_plugin_ver());
        \wp_enqueue_script(Utils::KEBAB . '-js', Utils::get_plugin_url() . '/js/dist/index.js', [  ], Utils::get_plugin_ver(), [
            'strategy'  => 'async',
            'in_footer' => true,
         ]);
    }

    /**
     * @param array $tabs
     * @return array
     */
    public function add_product_tab($tabs)
    {
        $tabs[ self::PRODUCT_TYPE_SLUG ] = array(
            'label'    => __('Power Partner', Utils::SNAKE),
            'target'   => self::PRODUCT_TYPE_SLUG,
            'class'    => [
                'show_if_variable-subscription', // 僅在可變訂閱顯示
             ],
            'priority' => 80,
        );

        return $tabs;
    }

    public function add_product_tab_content()
    {
        $post_id      = $_GET[ 'post' ] ?? null;
        $siteSelector = SiteSelector::get_instance();
        $defaultValue = \get_post_meta($post_id, "linked_site", true);
        ?>
<div id="<?=self::PRODUCT_TYPE_SLUG?>_product_data" style="float:left; width:80%;display:none;">
	<div style="padding:1.5rem 1rem;">
		<?=$siteSelector->render($defaultValue);?>
	</div>
</div>
<?php
}

    public function save_product_tab_content($post_id)
    {
        if (isset($_POST[ 'linked_site' ])) {
            \update_post_meta($post_id, "linked_site", $_POST[ 'linked_site' ]);
        }
    }

    public function do_site_sync($order_id)
    {

        $order = \wc_get_order($order_id);
        if (!$order) {
            return;
        }
        $items     = $order->get_items();
        $responses = [  ];
        foreach ($items as $item) {
            $product_id     = $item->get_product_id();
            $product        = \wc_get_product($product_id);
            $linked_site_id = \get_post_meta($product_id, 'linked_site', true);
            if (empty($linked_site_id)) {
                continue;
            }

            if ($product->is_type('variable')) {
                $variation_id  = $item->get_variation_id();
                $variation     = \wc_get_product($variation_id);
                $attributes    = $variation->get_attributes(); // [pa_power_partner_host_position] => jp | tw
                $host_position = $attributes[ Attributes::_taxonomy ] ?? '';
            }

            $responseObj = Fetch::site_sync([
                'site_id'       => $linked_site_id,
                'host_position' => $host_position,
                'partner_id'    => \get_option(Utils::SNAKE . '_partner_id', '0'),
                'customer'      => [
                    'id'         => $order->get_customer_id(),
                    'first_name' => $order->get_billing_first_name(),
                    'last_name'  => $order->get_billing_last_name(),
                    'email'      => $order->get_billing_email(),
                    'phone'      => $order->get_billing_phone(),
                 ],
             ]);
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

        $order->update_meta_data(Utils::ORDER_META_KEY, json_encode($responses));

        $order->save();
    }

    // TODO DELETE
    public function do_site_sync_test()
    {

        // $order = \wc_get_order(1752);
        $order = \wc_get_order(1774);
        if (!$order) {
            return;
        }

        $items       = $order->get_items();

        $customer_id = $order->get_customer_id();
        $customer    = [
            'id'         => $customer_id,
            'username'   => \get_user_by('id', $customer_id)->user_login ?? '',
            'first_name' => $order->get_billing_first_name(),
            'last_name'  => $order->get_billing_last_name(),
            'email'      => $order->get_billing_email(),
            'phone'      => $order->get_billing_phone(),
         ];
        $responses = [  ];
        foreach ($items as $item) {
            $product_id     = $item->get_product_id();
            $product        = \wc_get_product($product_id);
            $linked_site_id = \get_post_meta($product_id, 'linked_site', true);
            if (empty($linked_site_id)) {
                continue;
            }

            if ($product->is_type('variable')) {
                $variation_id  = $item->get_variation_id();
                $variation     = \wc_get_product($variation_id);
                $attributes    = $variation->get_attributes(); // [pa_power_partner_host_position] => jp | tw
                $host_position = $attributes[ Attributes::_taxonomy ] ?? '';
            }

            $responseObj = Fetch::site_sync([
                'site_id'       => $linked_site_id,
                'host_position' => $host_position,
                'partner_id'    => \get_option(Utils::SNAKE . '_partner_id', '174'),
                'customer'      => $customer,
             ]);

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

        $order->update_meta_data(Utils::ORDER_META_KEY, json_encode($responses));

        $order->save();
    }
}

new Product();