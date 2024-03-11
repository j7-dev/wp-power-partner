<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use Kucrut\Vite;

class Bootstrap
{

    public function __construct()
    {
        require_once __DIR__ . '/api/index.php';
        \add_action('admin_enqueue_scripts', [ $this, 'admin_enqueue_script' ], 100);
        \add_action('wp_enqueue_scripts', [ $this, 'enqueue_script' ], 100);
    }

    /**
     * Enqueue script
     */

		 public function enqueue_script(): void
    {
        Vite\enqueue_asset(
            Utils::get_plugin_dir() . '/js/dist',
            'js/src/main.tsx',
            [
                'handle'    => Utils::KEBAB,
                'in-footer' => true,
             ]
        );

        $post_id   = \get_the_ID();
        $permalink = \get_permalink($post_id);

        \wp_localize_script(Utils::KEBAB, Utils::SNAKE . '_data', array(
            'env' => [
                'siteUrl'     => \site_url(),
                'ajaxUrl'     => \admin_url('admin-ajax.php'),
                'userId'      => \get_current_user_id(),
                'postId'      => $post_id,
                'permalink'   => $permalink,
                "APP_NAME"    => Utils::APP_NAME,
                "KEBAB"       => Utils::KEBAB,
                "SNAKE"       => Utils::SNAKE,
                "BASE_URL"    => Utils::BASE_URL,
                "RENDER_ID_1" => Utils::RENDER_ID_1,
                "RENDER_ID_2" => Utils::RENDER_ID_2,
                "API_TIMEOUT" => Utils::API_TIMEOUT,
             ],
        ));

        \wp_localize_script(Utils::KEBAB, 'wpApiSettings', array(
            'root'  => \untrailingslashit(\esc_url_raw(rest_url())),
            'nonce' => \wp_create_nonce('wp_rest'),
        ));
    }

    public function admin_enqueue_script($hook): void
    {
        if ('toplevel_page_power_plugins_settings' !== $hook) {
            return;
        }
				$this->enqueue_script();
    }
}
