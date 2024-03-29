<?php
/**
 * Product 相關
 */

declare (strict_types = 1);

namespace J7\PowerPartner;

use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\DataTabs;

/**
 * Class Product
 */
final class Product {

	const PRODUCT_TYPE_NAME = Utils::APP_NAME . ' 產品';

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
		\add_action( 'woocommerce_order_status_completed', array( $this, 'do_site_sync' ) );
		// \add_action('admin_init', [ $this, 'do_site_sync_test' ]);
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
		\wp_enqueue_style( Utils::KEBAB . '-product-tab-css', Utils::get_plugin_url() . '/js/dist_product_tab/assets/css/index.css', array(), Utils::get_plugin_ver() );
		\wp_enqueue_script(
			Utils::KEBAB . '-product-tab-js',
			Utils::get_plugin_url() . '/js/dist_product_tab/index.js',
			array(),
			Utils::get_plugin_ver(),
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
	public function do_site_sync( $order_id ): void {
		$order = \wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		$items     = $order->get_items();
		$responses = array();
		foreach ( $items as $item ) {
			/**
			 * Type
			 *
			 * @var \WC_Order_Item_Product $item
			 */
			$product_id     = $item->get_product_id();
			$product        = \wc_get_product( $product_id );
			$linked_site_id = \get_post_meta( $product_id, DataTabs::LINKED_SITE_FIELD_NAME, true );
			if ( empty( $linked_site_id ) ) {
				continue;
			}

			$host_position = \get_post_meta( $product_id, DataTabs::HOST_POSITION_FIELD_NAME, true );
			$host_position = empty( $host_position ) ? 'jp' : $host_position;

			$responseObj = Fetch::site_sync(
				array(
					'site_url'      => \site_url(),
					'site_id'       => $linked_site_id,
					'host_position' => $host_position,
					'partner_id'    => \get_option( Utils::SNAKE . '_partner_id', '0' ),
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
				'status'  => $responseObj->status,
				'message' => $responseObj->message,
				'data'    => $responseObj->data,
			);
		}
		ob_start();
		print_r( $responses );
		$responses_string = ob_get_clean();
		// 把網站建立成功與否的資訊存到訂單的 meta data
		if ( is_array( $responses ) && count( $responses ) === 1 ) {
			$data = $responses[0]['data'] ?? array();
			$note = '';
			foreach ( $data as $key => $value ) {
				$note .= $key . ': ' . $value . '<br />';
			}

			$order->add_order_note( $note );
		} else {
			$order->add_order_note( $responses_string );
		}

		$order->update_meta_data( Utils::ORDER_META_KEY, \wp_json_encode( $responses ) );

		$order->save();
	}
}

new Product();
