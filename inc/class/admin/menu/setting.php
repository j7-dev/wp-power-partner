<?php
/**
 * Power Plugin Menu
 *
 * @package Power_Partner
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use J7\PowerPartner\Plugin;

/**
 * Class Setting
 */
final class Setting {
	const CONNECT_APP_CLASS = Plugin::KEBAB . '-connect-app';

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'admin_menu', array( __CLASS__, 'register_sub_menu' ), 20 );
	}

	/**
	 * Register sub menu
	 *
	 * @return void
	 */
	public static function register_sub_menu(): void {
		\add_submenu_page( 'power_plugins_settings', 'Power Partner', 'Power Partner', 'manage_options', 'power_partner_settings', array( __CLASS__, 'render_page' ), 10 );
	}


	/**
	 * Render page
	 *
	 * @return void
	 */
	public static function render_page(): void {
		printf(
			/*html*/            '<div id="%s"></div>',
			self::CONNECT_APP_CLASS // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		);
	}
}

new Setting();
