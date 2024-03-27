<?php

/**
 * Api
 */

declare(strict_types=1);

namespace J7\PowerPartner;

use J7\PowerPartner\Utils;

/**
 * Class Api
 */
final class Api {
	const DEFAULT_SUBJECT = '網站已開通';
	const DEFAULT_BODY    = '<p>嗨 ##FIRST_NAME##</p><p>你的網站開好囉，<a href="https://cloud.luke.cafe/docs" rel="noopener noreferrer" target="_blank">點此可以打開網站的使用說明書</a>，建議把基礎的都看完</p><p>如果是下單SIMPLE網站，說明書還在建置中，暫時先看POWER網站的</p><p>另外如果要將網站換成正式的網域，請參考<a href="https://cloud.luke.cafe/docs/domain-change/" rel="noopener noreferrer" target="_blank">這篇教學</a></p><p>有網站的問題都可以直接回覆這封信，或是到<a href="https://cloud.luke.cafe/" rel="noopener noreferrer" target="_blank">站長路可網站</a>的右下角對話框私訊</p><p>&nbsp;</p><p>以下是你的網站資訊</p><p>網站暫時網址：</p><p>##FRONTURL##</p><p>之後可換成你自己的網址</p><p>網站後台：</p><p>##ADMINURL##</p><p>帳號：</p><p>##SITEUSERNAME##</p><p>密碼：</p><p>##SITEPASSWORD##</p><p>進去後請記得改成自己的密碼喔</p><p>網站列表 + 進階設置：</p><p>##WORDPRESSAPPWCSITESACCOUNTPAGE##</p><p>網站主機ip：</p><p>##IPV4##</p><p>&nbsp;</p><p>這封信很重要，不要刪掉，這樣之後才找得到喔～</p><p>有問題請直接回覆這封信：）</p><p>&nbsp;</p><p>站長路可</p>';

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', array( $this, 'register_api_customer_notification' ) );
	}

	/**
	 * Register customer notification API
	 *
	 * @return void
	 */
	public function register_api_customer_notification(): void {
		\register_rest_route(
			Utils::KEBAB,
			'customer-notification',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'post_customer_notification_callback' ),
				// TODO 'permission_callback' => array( $this, 'check_basic_auth' ),
				'permission_callback' => '__return_true',
			)
		);

		\register_rest_route(
			Utils::KEBAB,
			'customer-notification',
			array(
				'methods'             => 'GET',
				'callback'            => array( $this, 'get_customer_notification_callback' ),
				// TODO 'permission_callback' => array( $this, 'check_basic_auth' ),
				'permission_callback' => '__return_true',
			)
		);
	}

	/**
	 * Post customer notification callback
	 * 發 Email 通知客戶
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return void
	 */
	public function post_customer_notification_callback( $request ) {

		$body_params = $request->get_json_params() ?? array();
		$customer_id = $body_params['CUSTOMER_ID'];
		$customer    = \get_user_by( 'id', $customer_id );
		if ( ! $customer ) {
			return;
		}

		$tokens                                   = array();
		$tokens['FIRST_NAME']                     = $customer->first_name;
		$tokens['LAST_NAME']                      = $customer->last_name;
		$tokens['NICE_NAME']                      = $customer->user_nicename;
		$tokens['EMAIL']                          = $customer->user_email;
		$tokens['WORDPRESSAPPWCSITESACCOUNTPAGE'] = $body_params['WORDPRESSAPPWCSITESACCOUNTPAGE'];
		$tokens['IPV4']                           = $body_params['IPV4'];
		$tokens['DOMAIN']                         = $body_params['DOMAIN'];
		$tokens['FRONTURL']                       = $body_params['FRONTURL'];
		$tokens['ADMINURL']                       = $body_params['ADMINURL'];
		$tokens['SITEUSERNAME']                   = $body_params['SITEUSERNAME'];
		$tokens['SITEPASSWORD']                   = $body_params['SITEPASSWORD'];

		$power_plugins_settings = \get_option( 'power_plugins_settings' );
		// 取得 subject
		$email_subject = $power_plugins_settings['power_partner_email_subject'];
		$email_subject = empty( $email_subject ) ? self::DEFAULT_SUBJECT : $email_subject;

		// 取得 message
		$email_body = $power_plugins_settings['power_partner_email_body'];
		$email_body = empty( $email_body ) ? self::DEFAULT_BODY : $email_body;

		// Replace tokens in email..
		$email_subject = Utils::replace_script_tokens( $email_subject, $tokens );
		$email_body    = Utils::replace_script_tokens( $email_body, $tokens );

		$email_headers = array( 'Content-Type: text/html; charset=UTF-8' );
		\wp_mail(
			$customer->user_email,
			$email_subject,
			$email_body,
			$email_headers
		);
	}

	/**
	 * Get customer notification callback
	 *
	 * @param \WP_REST_Request $request Request.
	 * @return \WP_REST_Response|\WP_Error
	 */
	public function get_customer_notification_callback( $request ) { // phpcs:ignore
		$power_plugins_settings = \get_option( 'power_plugins_settings' );
		return \rest_ensure_response(
			array(
				'status'  => 200,
				'message' => 'get customer notification success',
				'data'    => array(
					'subject' => $power_plugins_settings['power_partner_email_subject'],
					'body'    => $power_plugins_settings['power_partner_email_body'],
				),
			)
		);
	}
}

new Api();
