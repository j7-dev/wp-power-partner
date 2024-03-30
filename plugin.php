<?php
/**
 * Plugin Name:       Power Partner | 讓每個人都可以輕鬆地販售網站模板
 * Plugin URI:        https://cloud.luke.cafe/plugins/power-partner/
 * Description:       Power Partner 是一個 WordPress 套件，安裝後，可以讓你的 Woocommerce 商品與 cloud.luke.cafe 的模板網站連結，並且可以讓使用者自訂商品的價格，當用戶在您的網站下單後，會自動在 cloud.luke.cafe 創建網站，並且自動發送通知給用戶跟您。
 * Version:           1.3.3
 * Requires at least: 5.7
 * Requires PHP:      7.4
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

use J7\PowerPartner\Utils;
use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

require_once __DIR__ . '/vendor/autoload.php';

/**
 * Class Plugin
 */
final class Plugin {

	/**
	 * Instance
	 *
	 * @var Plugin
	 */
	private static $instance;

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
		require_once __DIR__ . '/required_plugins/index.php';
		require_once __DIR__ . '/inc/utils/index.php';
		require_once __DIR__ . '/inc/class/class-bootstrap.php';

		\register_activation_hook( __FILE__, array( $this, 'activate' ) );
		\register_deactivation_hook( __FILE__, array( $this, 'deactivate' ) );
		\add_action( 'plugins_loaded', array( $this, 'register_required_plugins' ) );
		\add_action( 'plugins_loaded', array( $this, 'check_required_plugins' ), 200 );

		$this->plugin_update_checker();
	}

	/**
	 * Check required plugins
	 *
	 * @return void
	 */
	public function check_required_plugins() {
		$instance          = call_user_func( array( __NAMESPACE__ . '\TGM_Plugin_Activation', 'get_instance' ) );
		$is_tgmpa_complete = $instance->is_tgmpa_complete();

		if ( $is_tgmpa_complete ) {
			new Bootstrap();
		}
	}

	/**
	 * Instance
	 *
	 * @return Plugin
	 */
	public static function instance() {
		if ( empty( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Wp plugin 更新檢查 update checker
	 *
	 * @return void
	 */
	public function plugin_update_checker(): void {
		$update_checker = PucFactory::buildUpdateChecker(
			Utils::GITHUB_REPO,
			__FILE__,
			Utils::KEBAB
		);
		/**
		 * Type
		 *
		 * @var \Puc_v4p4_VcsApi_GitHub $update_checker
		 */
		$update_checker->setBranch( 'master' );
		$update_checker->setAuthentication( Utils::get_github_pat() );
		$update_checker->getVcsApi()->enableReleaseAssets();
	}

	/**
	 * Register required plugins
	 *
	 * @return void
	 */
	public function register_required_plugins(): void {
		// phpcs:disable
		$config = array(
			'id'           => Utils::KEBAB, // Unique ID for hashing notices for multiple instances of TGMPA.
			'default_path' => '', // Default absolute path to bundled plugins.
			'menu'         => 'tgmpa-install-plugins', // Menu slug.
			'parent_slug'  => 'plugins.php', // Parent menu slug.
			'capability'   => 'manage_options', // Capability needed to view plugin install page, should be a capability associated with the parent menu used.
			'has_notices'  => true, // Show admin notices or not.
			'dismissable'  => false, // If false, a user cannot dismiss the nag message.
			'dismiss_msg'  => __( '這個訊息將在依賴套件被安裝並啟用後消失。' . Utils::APP_NAME . ' 沒有這些依賴套件的情況下將無法運作！', 'power_partner' ), // If 'dismissable' is false, this message will be output at top of nag.
			'is_automatic' => true, // Automatically activate plugins after installation or not.
			'message'      => '', // Message to output right before the plugins table.
			'strings'      => array(
				'page_title'                      => __( '安裝依賴套件', 'power_partner' ),
				'menu_title'                      => __( '安裝依賴套件', 'power_partner' ),
				'installing'                      => __( '安裝套件: %s', 'power_partner' ), // translators: %s: plugin name.
				'updating'                        => __( '更新套件: %s', 'power_partner' ), // translators: %s: plugin name.
				'oops'                            => __( 'OOPS! plugin API 出錯了', 'power_partner' ),
				'notice_can_install_required'     => _n_noop(
					// translators: 1: plugin name(s).
					Utils::APP_NAME . ' 依賴套件: %1$s.',
					Utils::APP_NAME . ' 依賴套件: %1$s.',
					'power_partner'
				),
				'notice_can_install_recommended'  => _n_noop(
					// translators: 1: plugin name(s).
					Utils::APP_NAME . ' 推薦套件: %1$s.',
					Utils::APP_NAME . ' 推薦套件: %1$s.',
					'power_partner'
				),
				'notice_ask_to_update'            => _n_noop(
					// translators: 1: plugin name(s).
					'以下套件需要更新版本來兼容 ' . Utils::APP_NAME . ': %1$s.',
					'以下套件需要更新版本來兼容 ' . Utils::APP_NAME . ': %1$s.',
					'power_partner'
				),
				'notice_ask_to_update_maybe'      => _n_noop(
					// translators: 1: plugin name(s).
					'以下套件有更新: %1$s.',
					'以下套件有更新: %1$s.',
					'power_partner'
				),
				'notice_can_activate_required'    => _n_noop(
					// translators: 1: plugin name(s).
					'以下依賴套件目前為停用狀態: %1$s.',
					'以下依賴套件目前為停用狀態: %1$s.',
					'power_partner'
				),
				'notice_can_activate_recommended' => _n_noop(
					// translators: 1: plugin name(s).
					'以下推薦套件目前為停用狀態: %1$s.',
					'以下推薦套件目前為停用狀態: %1$s.',
					'power_partner'
				),
				'install_link'                    => _n_noop(
					'安裝套件',
					'安裝套件',
					'power_partner'
				),
				'update_link'                     => _n_noop(
					'更新套件',
					'更新套件',
					'power_partner'
				),
				'activate_link'                   => _n_noop(
					'啟用套件',
					'啟用套件',
					'power_partner'
				),
				'return'                          => __( '回到安裝依賴套件', 'power_partner' ),
				'plugin_activated'                => __( '套件啟用成功', 'power_partner' ),
				'activated_successfully'          => __( '以下套件已成功啟用:', 'power_partner' ),
				// translators: 1: plugin name.
				'plugin_already_active'           => __( '沒有執行任何動作 %1$s 已啟用', 'power_partner' ),
				// translators: 1: plugin name.
				'plugin_needs_higher_version'     => __( Utils::APP_NAME . ' 未啟用。' . Utils::APP_NAME . ' 需要新版本的 %s 。請更新套件。', 'power_partner' ),
				// translators: 1: dashboard link.
				'complete'                        => __( '所有套件已成功安裝跟啟用 %1$s', 'power_partner' ),
				'dismiss'                         => __( '關閉通知', 'power_partner' ),
				'notice_cannot_install_activate'  => __( '有一個或以上的依賴/推薦套件需要安裝/更新/啟用', 'power_partner' ),
				'contact_admin'                   => __( '請聯繫網站管理員', 'power_partner' ),

				'nag_type'                        => 'error', // Determines admin notice type - can only be one of the typical WP notice classes, such as 'updated', 'update-nag', 'notice-warning', 'notice-info' or 'error'. Some of which may not work as expected in older WP versions.
			),
		);
		call_user_func( __NAMESPACE__ . '\tgmpa', $this->required_plugins, $config );
	}

	/**
	 * Do something on activate
	 *
	 * @return void
	 */
	public function activate(): void {
	}

	/**
	 * Do something on deactivate
	 *
	 * @return void
	 */
	public function deactivate(): void {
	}
}

Plugin::instance();
