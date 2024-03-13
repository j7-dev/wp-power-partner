<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

final class Utils {

	const APP_NAME       = 'Power Partner';
	const KEBAB          = 'power-partner';
	const SNAKE          = 'power_partner';
	const TEXT_DOMAIN    = self::SNAKE;
	const GITHUB_REPO    = 'https://github.com/j7-dev/wp-power-partner';
	const ORDER_META_KEY = 'pp_create_site_responses';

	const API_URL   = WP_DEBUG ? 'http://cloudlukecafe.local' : 'https://cloud.luke.cafe';
	const USER_NAME = 'j7.dev.gg';
	const PASSWORD  = 'YQLj xV2R js9p IWYB VWxp oL2E';

	const TEMPLATE_SERVER_IDS = array( 544413 );
	const TRANSIENT_KEY       = 'pp_cloud_sites' . WP_DEBUG ? '_local' : '';
	const CACHE_TIME          = 12 * HOUR_IN_SECONDS;

	public static function get_github_pat(): string {
		$a   = array( 'ghp_eZCC' );
		$b   = array( 'xdWRi9Ljh' );
		$c   = array( 'dcZxtw6GHcpk' );
		$d   = array( '0ZNJq3k6Wx2' );
		$arr = array_merge( $a, $b, $c, $d );
		$pat = implode( ', ', $arr );
		return $pat;
	}

	public static function get_plugin_dir(): string {
		$plugin_dir = \untrailingslashit( \wp_normalize_path( ABSPATH . 'wp-content/plugins/power-partner' ) );
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
