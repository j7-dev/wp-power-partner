<?php
/**
 * OrderView
 */

declare(strict_types=1);

namespace J7\PowerPartner\Order;

use J7\PowerPartner\Product\Product;

/*
* TODO
1. List 顯示開站狀態
2. List 顯示開站時間
*/

/**
 * Class OrderView
 */
final class OrderView {

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_filter( 'manage_edit-shop_order_columns', array( $this, 'add_order_column' ) );
		\add_action( 'manage_shop_order_posts_custom_column', array( $this, 'render_order_column' ) );
		\add_action( 'add_meta_boxes', array( $this, 'add_metabox' ) );
	}

	/**
	 * Add order column.
	 *
	 * @param array $columns Columns.
	 * @return array
	 */
	public function add_order_column( array $columns ): array {
		$columns[ Product::CREATE_SITE_RESPONSES_META_KEY ] = '開站狀態';
		return $columns;
	}

	/**
	 * Render order column.
	 *
	 * @param string $column Column.
	 * @return void
	 */
	public function render_order_column( $column ): void {
		global $post;

		if ( Product::CREATE_SITE_RESPONSES_META_KEY === $column ) {
			$order_id         = $post->ID;
			$order            = \wc_get_order( $order_id );
			$responses_string = $order->get_meta( Product::CREATE_SITE_RESPONSES_META_KEY );

			try {
				$responses = json_decode( $responses_string, true ) ?? array();
				$data      = $responses[0]['data'] ?? array();
			} catch ( \Throwable $th ) {
				$data = array();
				echo 'json_decode($responses_string) Error';
			}

			if ( ! empty( $data ) ) {
				foreach ( $data as $key => $value ) {
					echo '<span>' . esc_html( $key ) . ': ' . esc_html( $value ) . '</span><br />';
				}
			}
		}
	}

	/**
	 * Add metabox to order page
	 *
	 * @return void
	 */
	public function add_metabox(): void {
		global $post;
		$order_id = $post->ID;
		$order    = \wc_get_order( $order_id );
		if ( ! $order ) {
			return;
		}
		$responses_string = $order->get_meta( Product::CREATE_SITE_RESPONSES_META_KEY );
		if ( ! $responses_string ) {
			return;
		}

		\add_meta_box( Product::CREATE_SITE_RESPONSES_META_KEY . '_metabox', '此訂單的開站狀態', array( $this, Product::CREATE_SITE_RESPONSES_META_KEY . '_callback' ), 'shop_order', 'side', 'high' );
	}

	/**
	 * Callback for metabox
	 *
	 * @return void
	 */
	public function pp_create_site_responses_callback(): void {
		global $post;
		$order_id         = $post->ID;
		$order            = \wc_get_order( $order_id );
		$responses_string = $order->get_meta( Product::CREATE_SITE_RESPONSES_META_KEY );
		try {
			$responses = json_decode( $responses_string, true ) ?? array();
			$data      = $responses[0]['data'] ?? array();
		} catch ( \Throwable $th ) {
			$data = array();
			echo 'json_decode($responses_string) Error';
		}

		if ( ! empty( $data ) ) {
			foreach ( $data as $key => $value ) {
				echo '<span>' . esc_html( $key ) . ': ' . esc_html( $value ) . '</span><br />';
			}
		}
	}
}

new OrderView();
