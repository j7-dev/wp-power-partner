<?php
/**
 * Bootstrap
 *
 * @package J7\PowerPartner
 */

declare (strict_types = 1);

namespace J7\PowerPartner;

use Kucrut\Vite;

/**
 * Bootstrap
 */
final class Bootstrap {

	/**
	 * Constructor
	 */
	public function __construct() {
		require_once __DIR__ . '/admin/index.php';
		require_once __DIR__ . '/api/index.php';
		require_once __DIR__ . '/class-order-view.php';
		require_once __DIR__ . '/product/index.php';
		require_once __DIR__ . '/shortcode/index.php';
		require_once __DIR__ . '/components/index.php';

		\add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_script' ), 100 );
		\add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_script' ), 100 );
	}

	/**
	 * Enqueue script
	 *
	 * @return void
	 */
	public function enqueue_script(): void {
		Vite\enqueue_asset(
			Utils::get_plugin_dir() . '/js/dist',
			'js/src/main.tsx',
			array(
				'handle'    => Utils::KEBAB,
				'in-footer' => true,
			)
		);

		$post_id   = \get_the_ID();
		$permalink = \get_permalink( $post_id );

		\wp_localize_script(
			Utils::KEBAB,
			Utils::SNAKE . '_data',
			array(
				'env' => array(
					'siteUrl'     => \site_url(),
					'ajaxUrl'     => \admin_url( 'admin-ajax.php' ),
					'userId'      => \get_current_user_id(),
					'postId'      => $post_id,
					'permalink'   => $permalink,
					'APP_NAME'    => Utils::APP_NAME,
					'KEBAB'       => Utils::KEBAB,
					'SNAKE'       => Utils::SNAKE,
					'BASE_URL'    => Utils::BASE_URL,
					'RENDER_ID_1' => Utils::RENDER_ID_1,
					'RENDER_ID_2' => Utils::RENDER_ID_2,
					'API_TIMEOUT' => Utils::API_TIMEOUT,
				),
			)
		);

		\wp_localize_script(
			Utils::KEBAB,
			'wpApiSettings',
			array(
				'root'  => \untrailingslashit( \esc_url_raw( rest_url() ) ),
				'nonce' => \wp_create_nonce( 'wp_rest' ),
			)
		);
	}

	/**
	 * Enqueue in wp admin
	 *
	 * @param [mixed] $hook - The current admin page.
	 * @return void
	 */
	public function admin_enqueue_script( $hook ): void {
		if ( 'toplevel_page_power_plugins_settings' !== $hook ) {
			return;
		}
		$this->enqueue_script();
	}
}
