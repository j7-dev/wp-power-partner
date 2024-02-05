<?php

declare(strict_types=1);

namespace J7\PowerPartner;

class Utils
{
	const APP_NAME       = 'Power Partner';
	const KEBAB          = 'power-partner';
	const SNAKE          = 'power_partner';
	const GITHUB_REPO         = 'https://github.com/j7-dev/wp-power-partner';
	const GITHUB_PAT = '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';
	const ORDER_META_KEY = 'pp_create_site_responses';

	protected const API_URL   = WP_DEBUG ? 'http://luke.local' : 'https://cloud.luke.cafe';
	protected const USER_NAME = 'j7.dev.gg';
	protected const PASSWORD  = WP_DEBUG ? 'Hzn3 l5V8 FeRF qcBX EAmX A6w0' : 'YQLj xV2R js9p IWYB VWxp oL2E';

	protected const TEMPLATE_SERVER_IDS = WP_DEBUG ? [2202] : [544413];
	protected const TRANSIENT_KEY      = 'pp_cloud_sites' . WP_DEBUG ? '_local' : '';
	protected const CACHE_TIME      =  12 * HOUR_IN_SECONDS;



	public static function get_plugin_dir(): string
	{
		$plugin_dir = \untrailingslashit(\wp_normalize_path(ABSPATH . 'wp-content/plugins/power-partner'));
		return $plugin_dir;
	}

	public static function get_plugin_url(): string
	{
		$plugin_url = \untrailingslashit(\plugin_dir_url(Utils::get_plugin_dir() . '/plugin.php'));
		return $plugin_url;
	}

	public static function get_plugin_ver(): string
	{
		$plugin_data = \get_plugin_data(Utils::get_plugin_dir() . '/plugin.php');
		$plugin_ver  = $plugin_data['Version'];
		return $plugin_ver;
	}
}
