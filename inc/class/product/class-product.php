<?php
/**
 * Product 相關
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\DataTabs;

/**
 * Class Product
 */
final class Product {

	const PRODUCT_TYPE_NAME = Plugin::APP_NAME . ' 產品';

	const CREATE_SITE_RESPONSES_META_KEY = 'pp_create_site_responses';

	// the site id linked in cloud site
	const LINKED_SITE_IDS_META_KEY = 'pp_linked_site_ids';

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		\add_action( 'woocommerce_order_status_completed', array( $this, 'site_sync_by_order_id' ) );
	}

	/**
	 * Enqueue assets
	 *
	 * @return void
	 */
	public function enqueue_assets(): void {
		$screen = \get_current_screen();
		if ( $screen->id !== 'product' ) {
			return;
		}
		\wp_enqueue_style( Plugin::KEBAB . '-product-tab-css', Plugin::$url . '/js/dist_product_tab/assets/css/index.css', array(), Plugin::$version );
		\wp_enqueue_script(
			Plugin::KEBAB . '-product-tab-js',
			Plugin::$url . '/js/dist_product_tab/index.js',
			array(),
			Plugin::$version,
			array(
				'strategy'  => 'async',
				'in_footer' => true,
			)
		);
	}


	/**
	 * Do site sync
	 *
	 * @param int $order_id order id
	 * @return void
	 */
	public function site_sync_by_order_id( $order_id ): void {
		$order = \wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		$items     = $order->get_items();
		$responses = array();

		// 考慮訂單中每個商品都可能會綁定到不同的網站，所以做成 array
		$linked_site_ids = array();
		foreach ( $items as $item ) {
			/**
			 * Type
			 *
			 * @var \WC_Order_Item_Product $item
			 */
			$product_id = $item->get_product_id();
			$product    = \wc_get_product( $product_id );

			// 如果不是可變訂閱商品，就不處理
			if ( 'variable-subscription' === $product->get_type() ) {
				$variation_id      = $item->get_variation_id();
				$host_position     = \get_post_meta( $variation_id, DataTabs::HOST_POSITION_FIELD_NAME, true );
				$linked_site_id    = \get_post_meta( $variation_id, DataTabs::LINKED_SITE_FIELD_NAME, true );
				$linked_site_ids[] = $linked_site_id;
			} elseif ( 'subscription' === $product->get_type() ) {
				$host_position     = \get_post_meta( $product_id, DataTabs::HOST_POSITION_FIELD_NAME, true );
				$linked_site_id    = \get_post_meta( $product_id, DataTabs::LINKED_SITE_FIELD_NAME, true );
				$linked_site_ids[] = $linked_site_id;
			} else {
				continue;
			}

			if ( empty( $linked_site_id ) ) {
				continue;
			}

			$host_position = empty( $host_position ) ? DataTabs::DEFAULT_HOST_POSITION : $host_position;

			$response_obj = Fetch::site_sync(
				array(
					'site_url'      => \site_url(),
					'site_id'       => $linked_site_id,
					'host_position' => $host_position,
					'partner_id'    => \get_option( Plugin::SNAKE . '_partner_id', '0' ),
					'customer'      => array(
						'id'         => $order->get_customer_id(),
						'first_name' => $order->get_billing_first_name(),
						'last_name'  => $order->get_billing_last_name(),
						'username'   => \get_user_by( 'id', $order->get_customer_id() )->user_login ?? 'admin',
						'email'      => $order->get_billing_email(),
						'phone'      => $order->get_billing_phone(),
					),
				)
			);

			$responses[] = array(
				'status'  => $response_obj->status,
				'message' => $response_obj->message,
				'data'    => $response_obj->data,
			);
		}
		ob_start();
		print_r( $responses );
		$responses_string = ob_get_clean();

		// 把網站建立成功與否的資訊存到訂單的 meta data
		if ( is_array( $responses ) && count( $responses ) >= 1 ) {
			$note     = '';
			$response = $responses[0];
			if ( $response['status'] === 200 ) {
				$data = $response['data'] ?? array();

				foreach ( $data as $key => $value ) {
					$note .= $key . ': ' . $value . '<br />';
				}
			} else {
				ob_start();
				print_r( $response );
				$note = ob_get_clean();
			}

			$order->add_order_note( $note );
		} else {
			$order->add_order_note( $responses_string );
		}

		$order->update_meta_data( self::CREATE_SITE_RESPONSES_META_KEY, \wp_json_encode( $responses ) );
		$order->update_meta_data( self::LINKED_SITE_IDS_META_KEY, $linked_site_ids );

		$order->save();
	}
}

new Product();
