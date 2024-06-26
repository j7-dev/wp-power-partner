<?php
/**
 * Power Plugin Menu
 *
 * @package Power_Partner
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;
use J7\WpToolkit\PowerPlugins;

/**
 * Class Setting
 */
final class Setting {

	const ENABLE_BIGGEST_COUPON_FIELD_NAME         = Plugin::SNAKE . '_biggest_coupon';
	const ENABLE_SHOW_FURTHER_COUPONS_FIELD_NAME   = Plugin::SNAKE . '_show_further_coupons';
	const SHOW_FURTHER_COUPONS_QTY_FIELD_NAME      = Plugin::SNAKE . '_show_further_coupons_qty';
	const ENABLE_SHOW_COUPON_FORM_FIELD_NAME       = Plugin::SNAKE . '_show_coupon_form';
	const ENABLE_SHOW_AVAILABLE_COUPONS_FIELD_NAME = Plugin::SNAKE . '_show_available_coupons';

	const CONNECT_APP_CLASS = Plugin::KEBAB . '-connect-app';

	/**
	 * Constructor
	 */
	public function __construct() {
		$opt_name = PowerPlugins::OPT_NAME;
		\add_action( 'setup_theme', array( $this, 'set_redux_menu' ), 20 );
	}

	/**
	 * Set redux menu
	 *
	 * @return void
	 */
	public function set_redux_menu(): void {
		$power_plugins_instance = PowerPlugins::get_instance();
		$section                = array(
			'title' => Plugin::APP_NAME,
			'id'    => Plugin::KEBAB,
			'class' => self::CONNECT_APP_CLASS,
			// translators: Placeholder refers to the URL of the Github page.
			'desc'  => '<p><span class="dashicons dashicons-info" style="color: #52accc;"></span>' . sprintf( \esc_html__( '可以到 %1$s 查看主要功能與使用方式', 'power_partner' ), '<a href="' . Plugin::GITHUB_REPO . '" target="_blank">Github 頁面</a>' ) . '<p>',
			'icon'  => 'el el-digg',
		);

		$power_plugins_instance->set_sections( $section );
	}
}

new Setting();
