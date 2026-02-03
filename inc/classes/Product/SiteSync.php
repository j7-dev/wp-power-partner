<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Api\FetchPowerCloud;
use J7\PowerPartner\Product\DataTabs\LinkedSites;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;
use J7\PowerPartner\Domains\Email\Core\SubscriptionEmailHooks as EmailService;
use J7\PowerPartner\Utils\Token;

/** Class SiteSync */
final class SiteSync {
	use \J7\WpUtils\Traits\SingletonTrait;

	const PRODUCT_TYPE_NAME = 'Power Partner 產品';

	const CREATE_SITE_RESPONSES_META_KEY      = 'pp_create_site_responses';
	const CREATE_SITE_RESPONSES_ITEM_META_KEY = '_pp_create_site_responses_item'; // 加上下劃線前綴，隱藏在前端顯示

	// the site id linked in cloud site
	const LINKED_SITE_IDS_META_KEY = 'pp_linked_site_ids'; // pp === Power Partner

	/** Constructor */
	public function __construct() {
		\add_action( Action::INITIAL_PAYMENT_COMPLETE->get_action_hook(), [ $this, 'site_sync_by_subscription' ], 1, 2 );

		\add_action('powerhouse_delay_send_email', [ $this, 'send_email' ], 10, 2);
	}



	/**
	 * Do site sync
	 * 訂閱首次創建
	 *
	 * @param \WC_Subscription $subscription Subscription object.
	 * @param array            $args 參數
	 * @return void
	 */
	public function site_sync_by_subscription(\WC_Subscription $subscription, $args ): void { // phpcs:ignore

		try {

			$order_ids = $subscription->get_related_orders();

			$parent_order = $subscription->get_parent();

			if ( ! ( $parent_order instanceof \WC_Order ) ) {
				Plugin::logger( "訂閱 #{$subscription->get_id()} 的父訂單不是 WC_Order 實例", 'error' );
				return;
			}
			/** @var \WC_Order */
			$parent_order_id = $parent_order->get_id();

			// 確保只有一筆訂單 (parent order) 才會觸發 site sync，續訂不觸發
			if ( count( $order_ids ) !== 1) {
				return;
			}

			if ( reset( $order_ids ) !== $parent_order_id ) {
				Plugin::logger(
				"訂閱 #{$subscription->get_id()} 父訂單 ID 不一致",
				'error'
					);
				return;
			}

			$items     = $parent_order->get_items();
			$responses = [];

			foreach ( $items as $item ) {
				/** @var \WC_Order_Item_Product $item */
				$product_id = $item->get_variation_id() ?: $item->get_product_id();
				$product    = \wc_get_product( $product_id );

				// 如果不是可變訂閱商品，就不處理
				// linked_site_id 是模板站 ID
				if ( 'subscription_variation' === $product->get_type() ) {
					$variation_id      = $item->get_variation_id();
					$host_position     = \get_post_meta( $variation_id, LinkedSites::HOST_POSITION_FIELD_NAME, true );
					$linked_site_id    = \get_post_meta( $variation_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );
					$linked_site_ids[] = $linked_site_id;
				} elseif ( 'subscription' === $product->get_type() ) {
					$host_position  = \get_post_meta( $product_id, LinkedSites::HOST_POSITION_FIELD_NAME, true );
					$linked_site_id = \get_post_meta( $product_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );
				} else {
					continue;
				}

				if ( empty( $linked_site_id ) ) {
					continue;
				}

				$host_type = \get_post_meta( $product_id, LinkedSites::HOST_TYPE_FIELD_NAME, true );

				// 根據 host_type 判斷是否為 WPCD (舊架構) 或是 PowerCloud (新架構) 開站
				$site_sync_params = [
					'site_url'        => \site_url(),
					'site_id'         => $linked_site_id,
					'host_position'   => $host_position,
					'partner_id'      => \get_option( Plugin::$snake . '_partner_id', '0' ),
					'customer'        => [
						'id'         => $parent_order->get_customer_id(),
						'first_name' => $parent_order->get_billing_first_name(),
						'last_name'  => $parent_order->get_billing_last_name(),
						'username'   => \get_user_by( 'id', $parent_order->get_customer_id() )->user_login ?? 'admin',
						'email'      => $parent_order->get_billing_email(),
						'phone'      => $parent_order->get_billing_phone(),
					],
					'subscription_id' => $subscription->get_id(),
				];

				// 根據 host_type 選擇對應的 API
				// wpcd 為舊架構
				if ( $host_type === LinkedSites::WPCD_HOST_TYPE ) {
					// 舊架構：使用 Fetch::site_sync
					$response_obj = Fetch::site_sync( $site_sync_params );
				}

				// powercloud 為新架構（新架構是默認Host Type)
				if ( $host_type === LinkedSites::DEFAULT_HOST_TYPE ) {

					$open_site_plan_id = \get_post_meta( $product_id, LinkedSites::OPEN_SITE_PLAN_FIELD_NAME, true );
					$template_site_id  = \get_post_meta( $product_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );

					// 新架構：使用 FetchPowerCloud::site_sync
					[$response_obj, $wordpress_obj] = FetchPowerCloud::site_sync( $site_sync_params, $open_site_plan_id, $template_site_id );

					// 發送 email 給用戶，告知網站已建立成功
					if ( $response_obj?->status === 201 ) {
						$order_token = Token::get_order_tokens( $parent_order );

						// 拿到 email payloads
						$email_payloads = \array_merge(
							$order_token,
							[
								'CUSTOMER_ID'  => $parent_order->get_customer_id(),
								'REF_ORDER_ID' => $parent_order_id,
								'WORDPRESSAPPWCSITESACCOUNTPAGE' => '',
								'IPV4'         => '163.61.60.30',
								'DOMAIN'       => 'https://' . $wordpress_obj->domain,
								'FRONTURL'     => 'https://' . $wordpress_obj->domain,
								'ADMINURL'     => 'https://' . $wordpress_obj->domain . '/wp-admin',
								'SITEUSERNAME' => $wordpress_obj->wp_admin_email,
								'SITEPASSWORD' => $wordpress_obj->wp_admin_password,
								'NEW_SITE_ID'  => '',
							]
							);

						$subscription->update_meta_data( 'email_payloads_tmp', $email_payloads );
						$subscription->save();

						\as_schedule_single_action(
							\time() + 240,
							'powerhouse_delay_send_email',
							[
								'to'              => $wordpress_obj->wp_admin_email,
								'subscription_id' => $subscription->get_id(),
							]
							);

					}
				}

				$responses[] = [
					'status'  => $response_obj?->status,
					'message' => $response_obj?->message,
					'data'    => $response_obj?->data,
				];

				// 這邊把 $responses 保存到 order item 的 meta data
				$item->update_meta_data( self::CREATE_SITE_RESPONSES_ITEM_META_KEY, \wp_json_encode( $responses ) );
			}

			// 在所有 meta_data 添加完成後，統一保存一次
			// 這樣可以確保所有數據都被正確保存
			$subscription->save();

			Plugin::logger(
			"訂閱 #{$subscription->get_id()}  order_id: #{$parent_order_id}",
			'info',
			[
				'responses' => $responses,
			]
			);

			// 把網站建立成功與否的資訊存到訂單的 meta data
			if ( is_array( $responses ) && count( $responses ) >= 1 ) {
				$note     = '';
				$response = $responses[0];
				if ( $response['status'] === 200 ) {
					$data = $response['data'] ?? [];

					foreach ( $data as $key => $value ) {
						$note .= $key . ': ' . $value . '<br />';
					}
				} else {
					ob_start();
					print_r( $response );
					$note = ob_get_clean();
				}

				$parent_order->add_order_note( $note );
			}

			$parent_order->update_meta_data( self::CREATE_SITE_RESPONSES_META_KEY, \wp_json_encode( $responses ) );
			$parent_order->save();

			\do_action( 'pp_site_sync_by_subscription', $subscription );
		} catch (\Throwable $th) {
			$subscription->add_order_note( '網站建立失敗：' . $th->getMessage() );
			Plugin::logger(
			'訂閱 #' . $subscription->get_id() . ' 建立網站失敗',
			'error',
			[
				'error' => $th->getMessage(),
			],
			5
			);
		}
	}

	/**
	 * Get the related order IDs for a subscription based on an order type.
	 *
	 * @param \WC_Subscription $subscription Subscription object.
	 * @param string           $order_type Can include 'any', 'parent', 'renewal', 'resubscribe' and/or 'switch'. Defaults to 'any'.
	 * @return array List of related order IDs.
	 * @since 1.0.0 - Migrated from WooCommerce Subscriptions v2.3.0
	 * @deprecated 應該可以刪除了
	 */
	public function get_related_order_ids( $subscription, $order_type = 'any' ) {

		$related_order_ids = [];

		if ( in_array( $order_type, [ 'any', 'parent' ] ) && $subscription->get_parent_id() ) {
			$related_order_ids[ $subscription->get_parent_id() ] = $subscription->get_parent_id();
		}

		if ( 'parent' !== $order_type ) {

			$relation_types = ( 'any' === $order_type ) ? [ 'renewal', 'resubscribe', 'switch' ] : [ $order_type ];

			foreach ( $relation_types as $relation_type ) {
				$related_order_ids = array_merge( $related_order_ids, \WCS_Related_Order_Store::instance()->get_related_order_ids( $subscription, $relation_type ) );
			}
		}

		return $related_order_ids;
	}

	/**
	 * 延遲寄送 email
	 *
	 * @param string     $to 收件者
	 * @param int|string $subscription_id 訂閱 ID
	 * @return void
	 */
	public function send_email( string $to, int|string $subscription_id ): void {
		$subscription = \wcs_get_subscription( $subscription_id );
		if ( ! $subscription ) {
			return;
		}

		$email_payloads = $subscription->get_meta( 'email_payloads_tmp' );
		if ( ! $email_payloads ) {
			return;
		}

		EmailService::send_mail( $to, $email_payloads );

		$subscription->delete_meta_data( 'email_payloads_tmp' );
		$subscription->save();
	}
}
