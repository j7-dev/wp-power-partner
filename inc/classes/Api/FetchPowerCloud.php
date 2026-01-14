<?php

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Bootstrap;
use J7\PowerPartner\Api\Main;

/** Class FetchPowerCloud */
abstract class FetchPowerCloud {

const ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY = 'power_partner_allowed_template_options_powercloud';
// phpstan:ignore
const ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME = 7 * 24 * HOUR_IN_SECONDS;
/**
 * 發 API 開站
 *
 * @param array{
 *     site_url: string,
 *     site_id: string, // 複製的模板站 id，如果是 0 就是開空的 WP
 *     server_id?: string, // 指定的伺服器 id，不帶就是隨機
 *     host_position: string,
 *     partner_id: string,
 *          customer: array{
 *     id: int,
 *     first_name: string,
 *     last_name: string,
 *     username: string,
 *     email: string,
 *     phone: string,
 *     },
 *     subscription_id?: int,
 * } $props 開站所需的參數
 *
 * @return array<string, mixed>|\WP_Error — The response or WP_Error on failure.
 */
public static function site_sync( array $props ) {
	$args = [
		'body'    => \wp_json_encode( $props ),
		'headers' => [
			'Content-Type'  => 'application/json',
			'Authorization' => 'Basic ' . \base64_encode( Bootstrap::instance()->username . ':' . Bootstrap::instance()->psw ), // phpcs:ignore
		],
		'timeout' => 600,
	];
}


/**
 * 發 API 關站 disable
 *
 * @param string $site_id 網站 ID
 * @param string $reason  停用原因
 * @return array|\WP_Error — The response or WP_Error on failure.
 */
public static function disable_site() {}

/**
 * 取得經銷商允許的模板站（新架構 PowerCloud）
 * 會先判斷 transient 是否有資料，如果沒有則發 API 取得
 *
 * @return array<string, string>
 */
public static function get_allowed_template_options(): array {

	$allowed_template_options = \get_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY );
	$allowed_template_options = is_array($allowed_template_options) ? $allowed_template_options : [];

	if ( empty($allowed_template_options) ) {
		$result = self::fetch_template_sites_by_user();
		if ( \is_wp_error( $result ) ) {
			return [];
		}

		$allowed_template_options = $result;
	}


	\set_transient( self::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY, (array) $allowed_template_options, self::ALLOWED_TEMPLATE_OPTIONS_CACHE_TIME );

	return (array) $allowed_template_options;
}

/**
 * 取得合作夥伴的模板站（新架構 PowerCloud）
 *
 * @return array|null|\WP_Error — The response or WP_Error on failure.
 */
public static function fetch_template_sites_by_user(): array {
	$_allowed_template_options = [];
	$current_user_id           = \get_current_user_id();
	$powercloud_api_key        = \get_transient(Main::POWERCLOUD_API_KEY_TRANSIENT_KEY . '_' . $current_user_id);

	$args     = [
		'headers' => [
			'Content-Type' => 'application/json',
			'X-API-Key'    => $powercloud_api_key,
		],
		'timeout' => 600,
	];
	$response = \wp_remote_get( Bootstrap::instance()->powercloud_api . '/templates/wordpress?page=1&limit=250', $args );

	if ( \is_wp_error( $response ) ) {
		return [];
	}

	$response_body = json_decode( $response['body'], true );

	$template_sites = is_array($response_body['data']) ? $response_body['data'] : [];

	foreach ( $template_sites as $template_site ) {
		if ( isset( $template_site['domain'] ) && isset( $template_site['id'] ) ) {
			$_allowed_template_options[ (string) $template_site['id'] ] = $template_site['domain'];
		}
	}

	return $_allowed_template_options;
}
}