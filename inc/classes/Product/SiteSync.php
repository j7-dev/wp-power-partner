<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\DataTabs\LinkedSites;

/** Class SiteSync */
final class SiteSync {
	use \J7\WpUtils\Traits\SingletonTrait;

	const PRODUCT_TYPE_NAME = 'Power Partner 產品';

	const CREATE_SITE_RESPONSES_META_KEY = 'pp_create_site_responses';

	// the site id linked in cloud site
	const LINKED_SITE_IDS_META_KEY = 'pp_linked_site_ids';

	/** Constructor */
	public function __construct() {
		\add_action( 'woocommerce_subscription_payment_complete', [ $this, 'site_sync_by_subscription' ], 20, 1 );
	}



	/**
	 * Do site sync
	 * 訂閱首次創建
	 *
	 * @param \WC_Subscription $subscription Subscription object.
	 * @return void
	 */
	public function site_sync_by_subscription(\WC_Subscription $subscription ): void { // phpcs:ignore

		$order_ids = $subscription->get_related_orders();

		$parent_order = $subscription->get_parent();

		if ( ! ( $parent_order instanceof \WC_Order ) ) {
			Plugin::log( "訂閱 #{$subscription->get_id()} 的父訂單不是 WC_Order 實例", 'error' );
			return;
		}

		$parent_order_id = $parent_order->get_id();

		// 確保只有一筆訂單 (parent order) 才會觸發 site sync，續訂不觸發
		if ( count( $order_ids ) !== 1) {
			return;
		}

		if ( reset( $order_ids ) !== $parent_order_id ) {
			Plugin::log(
				"訂閱 #{$subscription->get_id()} 父訂單 ID 不一致",
				'error'
				);
			return;
		}

		$items     = $parent_order->get_items();
		$responses = [];

		foreach ( $items as $item ) {
			/** @var \WC_Order_Item_Product $item */
			$product_id = $item->get_product_id();
			$product    = \wc_get_product( $product_id );

			// 如果不是可變訂閱商品，就不處理
			if ( 'variable-subscription' === $product->get_type() ) {
				$variation_id   = $item->get_variation_id();
				$host_position  = \get_post_meta( $variation_id, LinkedSites::HOST_POSITION_FIELD_NAME, true );
				$linked_site_id = \get_post_meta( $variation_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );
				$subscription->add_meta_data( self::LINKED_SITE_IDS_META_KEY, $linked_site_id );
				$subscription->save();
				$linked_site_ids[] = $linked_site_id;
			} elseif ( 'subscription' === $product->get_type() ) {
				$host_position  = \get_post_meta( $product_id, LinkedSites::HOST_POSITION_FIELD_NAME, true );
				$linked_site_id = \get_post_meta( $product_id, LinkedSites::LINKED_SITE_FIELD_NAME, true );
				$subscription->add_meta_data( self::LINKED_SITE_IDS_META_KEY, $linked_site_id );
				$subscription->save();
			} else {
				continue;
			}

			if ( empty( $linked_site_id ) ) {
				continue;
			}

			$host_position = empty( $host_position ) ? LinkedSites::DEFAULT_HOST_POSITION : $host_position;

			$response_obj = Fetch::site_sync(
				[
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
				]
			);

			$responses[] = [
				'status'  => $response_obj?->status,
				'message' => $response_obj?->message,
				'data'    => $response_obj?->data,
			];
		}

		Plugin::log(
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
}
