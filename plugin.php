<?php
/**
 * Plugin Name:       Power Partner | 讓每個人都可以輕鬆地販售網站模板
 * Plugin URI:        https://cloud.luke.cafe/plugins/power-partner/
 * Description:       Power Partner 是一個 WordPress 套件，安裝後，可以讓你的 Woocommerce 商品與 cloud.luke.cafe 的模板網站連結，並且可以讓使用者自訂商品的價格，當用戶在您的網站下單後，會自動在 cloud.luke.cafe 創建網站，並且自動發送通知給用戶跟您。
 * Version:           2.4.2
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

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;
use Micropackage\Singleton\Singleton;
use J7_Required_Plugins;

if ( ! \class_exists( 'J7\PowerPartner\Plugin' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
	/**
	 * Class Plugin
	 */
	final class Plugin extends Singleton {
		const APP_NAME    = 'Power Partner';
		const KEBAB       = 'power-partner';
		const SNAKE       = 'power_partner';
		const GITHUB_REPO = 'https://github.com/j7-dev/wp-power-partner';

		/**
		 * Is Local Dev Local
		 *
		 * @var bool
		 */
		public static $is_local = false;

		/**
		 * Plugin Directory
		 *
		 * @var string
		 */
		public static $dir;

		/**
		 * Plugin URL
		 *
		 * @var string
		 */
		public static $url;

		/**
		 * Plugin Version
		 *
		 * @var string
		 */
		public static $version;

		/**
		 * Required plugins
		 *
		 * @var array
		 */
		public $required_plugins = array(
			array(
				'name'     => 'WooCommerce',
				'slug'     => 'woocommerce',
				'required' => true,
				'version'  => '7.6.1',
			),
			array(
				'name'     => 'WP Toolkit',
				'slug'     => 'wp-toolkit',
				'source'   => 'https://github.com/j7-dev/wp-toolkit/releases/latest/download/wp-toolkit.zip',
				'required' => true,
				'version'  => '0.3.1',
			),
			array(
				'name'     => 'Woo Subscriptions',
				'slug'     => 'woocommerce-subscriptions',
				// 'source'   => '',
				'required' => true,
				'version'  => '5.9.0',
			),
		);

		/**
		 * Constructor
		 */
		public function __construct() {
			require_once __DIR__ . '/inc/class/class-bootstrap.php';

			\register_activation_hook( __FILE__, array( $this, 'activate' ) );
			\register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
			\add_action( 'plugins_loaded', array( $this, 'check_required_plugins' ) );

			$this->register_required_plugins();
			$this->plugin_update_checker();
		}

		/**
		 * Check required plugins
		 *
		 * @return void
		 */
		public function check_required_plugins() {
			$instance         = \J7_Required_Plugins::get_instance( self::KEBAB );
			$is_j7rp_complete = $instance->is_j7rp_complete();
			if ( $is_j7rp_complete ) {
				self::$dir = \untrailingslashit( \wp_normalize_path( \plugin_dir_path( __FILE__ ) ) );
				self::$url = \untrailingslashit( \plugin_dir_url( __FILE__ ) );
				if ( ! \function_exists( 'get_plugin_data' ) ) {
					require_once \ABSPATH . 'wp-admin/includes/plugin.php';
				}
				$plugin_data   = \get_plugin_data( __FILE__ );
				self::$version = $plugin_data['Version'];

				Bootstrap::get();
			}
		}

		/**
		 * Plugin update checker
		 *
		 * @return void
		 */
		public function plugin_update_checker(): void {
			try {
				$update_checker = PucFactory::buildUpdateChecker(
					self::GITHUB_REPO,
					__FILE__,
					self::KEBAB
				);
				/**
				 * Type
				 *
				 * @var \Puc_v4p4_Vcs_PluginUpdateChecker $update_checker
				 */
				$update_checker->setBranch( 'master' );
				// if your repo is private, you need to set authentication
				// $update_checker->setAuthentication( self::$env['GITHUB_TOKEN'] );
				$update_checker->getVcsApi()->enableReleaseAssets();
			} catch (\Throwable $th) { // phpcs:ignore
				// throw $th;
			}
		}

		/**
		 * Register required plugins
		 *
		 * @return void
		 */
		public function register_required_plugins(): void {
			// phpcs:disable
			$config = array(
				'id'           => Plugin::KEBAB, // Unique ID for hashing notices for multiple instances of TGMPA.
				'default_path' => '', // Default absolute path to bundled plugins.
				'menu'         => 'tgmpa-install-plugins', // Menu slug.
				'parent_slug'  => 'plugins.php', // Parent menu slug.
				'capability'   => 'manage_options', // Capability needed to view plugin install page, should be a capability associated with the parent menu used.
				'has_notices'  => true, // Show admin notices or not.
				'dismissable'  => false, // If false, a user cannot dismiss the nag message.
				'dismiss_msg'  => __( '這個訊息將在依賴套件被安裝並啟用後消失。' . Plugin::APP_NAME . ' 沒有這些依賴套件的情況下將無法運作！', 'wp_react_plugin' ), // If 'dismissable' is false, this message will be output at top of nag.
				'is_automatic' => true, // Automatically activate plugins after installation or not.
				'message'      => '', // Message to output right before the plugins table.
				'strings'      => array(
					'page_title'                      => __( '安裝依賴套件', 'wp_react_plugin' ),
					'menu_title'                      => __( '安裝依賴套件', 'wp_react_plugin' ),
					'installing'                      => __( '安裝套件: %s', 'wp_react_plugin' ), // translators: %s: plugin name.
					'updating'                        => __( '更新套件: %s', 'wp_react_plugin' ), // translators: %s: plugin name.
					'oops'                            => __( 'OOPS! plugin API 出錯了', 'wp_react_plugin' ),
					'notice_can_install_required'     => _n_noop(
						// translators: 1: plugin name(s).
						Plugin::APP_NAME . ' 依賴套件: %1$s.',
						Plugin::APP_NAME . ' 依賴套件: %1$s.',
						'wp_react_plugin'
					),
					'notice_can_install_recommended'  => _n_noop(
						// translators: 1: plugin name(s).
						Plugin::APP_NAME . ' 推薦套件: %1$s.',
						Plugin::APP_NAME . ' 推薦套件: %1$s.',
						'wp_react_plugin'
					),
					'notice_ask_to_update'            => _n_noop(
						// translators: 1: plugin name(s).
						'以下套件需要更新到最新版本來兼容 ' . Plugin::APP_NAME . ': %1$s.',
						'以下套件需要更新到最新版本來兼容 ' . Plugin::APP_NAME . ': %1$s.',
						'wp_react_plugin'
					),
					'notice_ask_to_update_maybe'      => _n_noop(
						// translators: 1: plugin name(s).
						'以下套件有更新: %1$s.',
						'以下套件有更新: %1$s.',
						'wp_react_plugin'
					),
					'notice_can_activate_required'    => _n_noop(
						// translators: 1: plugin name(s).
						'以下依賴套件目前為停用狀態: %1$s.',
						'以下依賴套件目前為停用狀態: %1$s.',
						'wp_react_plugin'
					),
					'notice_can_activate_recommended' => _n_noop(
						// translators: 1: plugin name(s).
						'以下推薦套件目前為停用狀態: %1$s.',
						'以下推薦套件目前為停用狀態: %1$s.',
						'wp_react_plugin'
					),
					'install_link'                    => _n_noop(
						'安裝套件',
						'安裝套件',
						'wp_react_plugin'
					),
					'update_link'                     => _n_noop(
						'更新套件',
						'更新套件',
						'wp_react_plugin'
					),
					'activate_link'                   => _n_noop(
						'啟用套件',
						'啟用套件',
						'wp_react_plugin'
					),
					'return'                          => __( '回到安裝依賴套件', 'wp_react_plugin' ),
					'plugin_activated'                => __( '套件啟用成功', 'wp_react_plugin' ),
					'activated_successfully'          => __( '以下套件已成功啟用:', 'wp_react_plugin' ),
					// translators: 1: plugin name.
					'plugin_already_active'           => __( '沒有執行任何動作 %1$s 已啟用', 'wp_react_plugin' ),
					// translators: 1: plugin name.
					'plugin_needs_higher_version'     => __( Plugin::APP_NAME . ' 未啟用。' . Plugin::APP_NAME . ' 需要新版本的 %s 。請更新套件。', 'wp_react_plugin' ),
					// translators: 1: dashboard link.
					'complete'                        => __( '所有套件已成功安裝跟啟用 %1$s', 'wp_react_plugin' ),
					'dismiss'                         => __( '關閉通知', 'wp_react_plugin' ),
					'notice_cannot_install_activate'  => __( '有一個或以上的依賴/推薦套件需要安裝/更新/啟用', 'wp_react_plugin' ),
					'contact_admin'                   => __( '請聯繫網站管理員', 'wp_react_plugin' ),

					'nag_type'                        => 'error', // Determines admin notice type - can only be one of the typical WP notice classes, such as 'updated', 'update-nag', 'notice-warning', 'notice-info' or 'error'. Some of which may not work as expected in older WP versions.
				),
			);

			\j7rp($this->required_plugins, $config);
		}

		/**
		 * Activate
		 *
		 * @return void
		 */
		public function activate(): void {
		}

		/**
		 * Deactivate
		 *
		 * @return void
		 */
		public function deactivate(): void {

			if( ! \class_exists( __NAMESPACE__ . '\Cron\Cron' ) ) {
				return;
			}
			// 註銷 CRON 事件
			\wp_clear_scheduled_hook( Cron\Cron::SEND_EMAIL_HOOK_NAME );
			\wp_clear_scheduled_hook( Cron\Cron::SYNC_SUBSCRIPTION_META_HOOK_NAME );
		}
	}

	Plugin::get();
}
