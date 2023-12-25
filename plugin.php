<?php

/**
 * Plugin Name:       Power Partner Server | 一些WPCD的額外設定，讓 partner 都可以輕鬆地販售網站模板
 * Plugin URI:        https://cloud.luke.cafe/plugins/power-partner/
 * Description:       Power Partner Server版 是一個 WordPress 套件，安裝後，在 WPCD 選單會有額外的設定，可以指定讓 partner 們販售的網站要開在哪一台主機。
 * Version:           0.0.1
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
namespace J7\PowerPartnerServer\Inc;

\add_action('plugins_loaded', __NAMESPACE__ . '\checkDependency');
function checkDependency()
{
    if (!class_exists('WPCD_Init', false)) {
        \add_action('admin_notices', __NAMESPACE__ . '\dependencyNotice');
    } else {
        new Bootstrap();
    }
}

// 顯示 WooCommerce 未安裝的通知
function dependencyNotice(): void
{
    ?>
		<div class="notice notice-error is-dismissible">
			<p>使用 Power Partner Server 外掛必須先安裝並啟用 <a href="https://wpclouddeploy.com/" target="_blank">WPCD</a> ，請先安裝並啟用 <a href="https://wpclouddeploy.com/" target="_blank">WPCD</a></p>
		</div>
<?php
}

class Bootstrap
{
    const APP_NAME = 'Power Partner Server';
    const KEBAB    = 'power-partner-server';
    const SNAKE    = 'power_partner_server';
    public function __construct()
    {
        \add_filter('wpcd_settings_tabs', [ $this, 'powerPartnerServerSettingTab' ], 10, 1);
        \add_filter('wpcd_settings_metaboxes', [ $this, 'powerPartnerServerSettingTabDisplay' ], 10, 1);
        \add_action('rest_api_init', [ $this, 'siteSync' ]);

    }

    public function powerPartnerServerSettingTab(array $tabs): array
    {
        $tabs[ self::KEBAB . '-tab' ] = self::APP_NAME . " 設定";
        return $tabs;
    }
    public function powerPartnerServerSettingTabDisplay(array $meta_boxes): array
    {
        $meta_boxes[  ] = [
            'id'             => self::KEBAB . '-metabox',
            'title'          => self::APP_NAME . " 設定",
            'settings_pages' => 'wpcd_settings',
            'tab'            => self::KEBAB . '-tab',
            'fields'         => [
                [
                    'name'            => '請選擇 partner 販售的網站要安裝在那些 Server 上',
                    'id'              => self::SNAKE . '_allowed_servers',
                    'type'            => 'select_advanced',
                    'options'         => $this->getServerOptions(),
                    'select_all_none' => true,
                    'multiple'        => true,
                    'desc'            => '',
                    'placeholder'     => '請選擇 Server',
                 ],
             ],
         ];
        return $meta_boxes;
    }

    private function getServerOptions(): array
    {
        $args = array(
            'post_type'      => 'wpcd_app_server',
            'post_status'    => 'private',
            'posts_per_page' => -1,
        );
        $posts   = get_posts($args);
        $servers = [  ];
        foreach ($posts as $post) {
            $servers[ $post->ID ] = $post->post_title;
        }
        return $servers;
    }

    private function getAllowedServers(): array
    {
        $wpcd_settings   = get_option('wpcd_settings');
        $allowed_servers = $wpcd_settings[ self::SNAKE . '_allowed_servers' ] ?? [  ];
        return $allowed_servers;
    }

    public function siteSync(): void
    {
        register_rest_route(self::KEBAB, "site-sync", array(
            'methods'  => 'POST',
            'callback' => [ $this, 'siteSyncCallback' ],
        ));
    }

    public function siteSyncCallback($request)
    {
        $body_params        = $request->get_body_params() ?? [  ];
        $id                 = $body_params[ 'site_id' ];
        $assigned_server_id = $body_params[ 'server_id' ]; // 指定 server id

        $allowed_servers = $this->getAllowedServers();
        // 如果不指定 就 隨機
        $server_id = empty($assigned_server_id) ? $allowed_servers[ array_rand($allowed_servers) ] : $assigned_server_id;
        if (empty($server_id)) {
            return rest_ensure_response([
                'message' => 'No server is allowed to sync',
             ]);
        }
        $args = [
            'site_sync_destination'          => $server_id,
            'sec_source_dest_check_override' => 1,
         ];

        try {
            $instance = new \WPCD_WORDPRESS_TABS_SITE_SYNC();
            $instance->do_site_sync_action($id, $args);

            return rest_ensure_response([
                'message' => "Site {$id} sync to server {$server_id}",
             ]);
        } catch (\Throwable $th) {
            // throw $th;
            return rest_ensure_response([
                'message' => "Site {$id} or server {$server_id} invalid",
             ]);
        }

    }

}

new Bootstrap();
