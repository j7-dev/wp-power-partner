<?php

declare(strict_types=1);

namespace J7\PowerPartner\Api;

use J7\PowerPartner\Bootstrap;

/** Class FetchPowerCloud */
abstract class FetchPowerCloud {

	const ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY = 'power_partner_allowed_template_options';
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
		$args     = [
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
	 * 取得經銷商允許的模板站
	 * 會先判斷 transient 是否有資料，如果沒有則發 API 取得
	 *
	 * @return array<string, string>
	 */
	public static function get_allowed_template_options(): array {}

	/**
	 * 取得合作夥伴的模板站
	 *
	 * @return array|null|\WP_Error — The response or WP_Error on failure.
	 */
	public static function fetch_template_sites_by_user() {}
}
