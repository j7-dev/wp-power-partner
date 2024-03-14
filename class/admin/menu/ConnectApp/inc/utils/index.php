<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use J7\PowerPartner\Shortcode;

abstract class Utils {

	const APP_NAME    = 'Connect App';
	const KEBAB       = 'connect-app';
	const SNAKE       = 'connect_app';
	const TEXT_DOMAIN = self::SNAKE;

	const BASE_URL    = '/';
	const RENDER_ID_1 = '.redux-group-tab.power-partner-connect-app';
	const RENDER_ID_2 = '.' . Shortcode::CURRENT_USER_SITE_LIST_SHORTCODE;
	const API_TIMEOUT = '30000';

	const DEFAULT_IMAGE = 'http://1.gravatar.com/avatar/1c39955b5fe5ae1bf51a77642f052848?s=96&d=mm&r=g';

	public static function get_plugin_dir(): string {
		$plugin_dir = \untrailingslashit( \wp_normalize_path( ABSPATH . 'wp-content/plugins/power-partner/class/admin/menu/ConnectApp' ) );
		return $plugin_dir;
	}

	public static function get_plugin_url(): string {
		$plugin_url = \untrailingslashit( \plugin_dir_url( self::get_plugin_dir() . '/plugin.php' ) );
		return $plugin_url;
	}

	public static function get_plugin_ver(): string {
		$plugin_data = \get_plugin_data( self::get_plugin_dir() . '/plugin.php' );
		$plugin_ver  = $plugin_data['Version'];
		return $plugin_ver;
	}
}
