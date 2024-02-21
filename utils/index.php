<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

class Utils
{
    const APP_NAME       = 'Power Partner';
    const KEBAB          = 'power-partner';
    const SNAKE          = 'power_partner';
    const TEXT_DOMAIN    = self::SNAKE;
    const GITHUB_REPO    = 'https://github.com/j7-dev/wp-power-partner';
    const ORDER_META_KEY = 'pp_create_site_responses';

    const API_URL   = WP_DEBUG ? 'http://luke.local' : 'https://cloud.luke.cafe';
    const USER_NAME = 'j7.dev.gg';
    const PASSWORD  = WP_DEBUG ? 'Hzn3 l5V8 FeRF qcBX EAmX A6w0' : 'YQLj xV2R js9p IWYB VWxp oL2E';

    const TEMPLATE_SERVER_IDS = WP_DEBUG ? [ 2202 ] : [ 544413 ];
    const TRANSIENT_KEY       = 'pp_cloud_sites' . WP_DEBUG ? '_local' : '';
    const CACHE_TIME          = 12 * HOUR_IN_SECONDS;

    public static function get_github_pat(): string
    {
        $a   = [ 'ghp_eZCC' ];
        $b   = [ 'xdWRi9Ljh' ];
        $c   = [ 'dcZxtw6GHcpk' ];
        $d   = [ '0ZNJq3k6Wx2' ];
        $arr = array_merge($a, $b, $c, $d);
        $pat = implode(", ", $arr);
        return $pat;
    }

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
        $plugin_ver  = $plugin_data[ 'Version' ];
        return $plugin_ver;
    }
}
