<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Utils;

use J7\PowerPartner\Bootstrap;

/** Class Base */
abstract class Base {
	const BASE_URL      = '/';
	const APP1_SELECTOR = '#power-partner-connect-app';
	// const APP2_SELECTOR = '.' . Shortcode::CURRENT_USER_SITE_LIST_SHORTCODE;
	const APP2_SELECTOR = '.power_partner_current_user_site_list';

	const API_TIMEOUT   = '30000';
	const DEFAULT_IMAGE = 'http://1.gravatar.com/avatar/1c39955b5fe5ae1bf51a77642f052848?s=96&d=mm&r=g';

	const TEMPLATE_SERVER_IDS = [ 544413 ];
	const CACHE_TIME          = 24 * HOUR_IN_SECONDS;

	/**
	 * Set API auth 調整環境變數
	 *
	 * @param Bootstrap   $bootstrap Bootstrap 實例
	 * @param string|null $env 環境名稱
	 * @return void
	 */
	public static function set_api_auth( Bootstrap $bootstrap, ?string $env = null ): void {

		$env     = $env ?? \wp_get_environment_type();
		$is_home = defined('IS_HOME');

		switch ($env) { // phpcs:ignore
			// local 麗寶之星家裡
			// $username = 'j7.dev.gg';
			// $psw      = '5NTw cqYl uhJU pixF Myj6 rBuA';
			// $base_url = 'https://cloud.local';
			case 'local': // local 辦公室
				$username = $is_home ? 'j7.dev.gg' : 'powerpartner';
				$psw      = $is_home ? '5NTw cqYl uhJU pixF Myj6 rBuA' : 'WDdk K7nm SSNr AwGy Dhab sipK';
				$base_url = $is_home ? 'http://cloud.local' : 'http://cloud.local';
				break;
			case 'staging': // staging 線上測試站
				$username = 'powerpartner';
				$psw      = '9Nve BO2G oe8y B19G SDNd v68Q';
				$base_url = 'https://cloud-staging.wpsite.pro';
				break;
			default: // PROD
				$username = 'powerpartner';
				$psw      = 'uJsk Gu3S pwUG r6ia P9zy Xjrj';
				$base_url = 'https://cloud.luke.cafe';
				break;
		}

		$bootstrap->username = $username;
		$bootstrap->psw      = $psw;
		$bootstrap->base_url = $base_url;
		$bootstrap->t        = base64_encode( "$username:$psw" );
	}

	/**
	 * Mail_to function
	 *
	 * @param string  $subject - email subject
	 * @param string  $message - email message
	 * @param integer $mix - user id | email string | email string[]
	 * @param bool    $send_to_admin - send to admin
	 * @return void
	 */
	public static function mail_to( string $subject, string $message, $mix = 0, $send_to_admin = true ): void {
		$email = [];

		if ( \is_email( $mix ) ) {
			$added_email = $mix;
			$email       = [ ...$email, $added_email ];
		}

		if ( \is_array( $mix ) ) {
			$email = [ ...$email, ...$mix ];
		}

		if ( is_numeric( $mix ) && $mix > 0 ) {
			$added_email = \get_user_by( 'id', $mix )->user_email;
			$email       = [ ...$email, $added_email ];
		}

		if ( $send_to_admin ) {
			$added_email = [ 'j7.dev.gg@gmail.com', 'luke.cafe.team@gmail.com' ];

			$email = [ ...$email, ...$added_email ];
		}

		$headers = [ 'Content-Type: text/html; charset=UTF-8' ];
		\wp_mail( $email, $subject, $message, $headers );
	}


	/**
	 * Delete post meta by meta id
	 *
	 * @param int $mid - meta id
	 * @return string
	 */
	public static function delete_post_meta_by_mid( $mid ) {
		global $wpdb;

		// 执行删除查询
		$deleted = $wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->prefix}postmeta WHERE meta_id = %d", $mid ) );

		$delete_success = $deleted !== false;

		return $delete_success;
	}
}
