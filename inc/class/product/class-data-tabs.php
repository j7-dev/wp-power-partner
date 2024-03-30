<?php
/**
 * 在 wp-admin 商品編輯頁
 * 對 wc-tabs 新增欄位
 * 只對 簡單訂閱商品 新增
 * TODO 可變訂閱商品
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Utils;

/**
 * Class DataTabs
 */
final class DataTabs {
	const HOST_POSITION_FIELD_NAME = Utils::SNAKE . '_host_position';
	const LINKED_SITE_FIELD_NAME   = 'linked_site';
	const PRODUCT_TYPE_SLUG        = Utils::SNAKE;

	/**
	 * Host positions
	 *
	 * @var array
	 */
	public $host_positions = array(
		'jp' => '日本',
		'tw' => '台灣',
	);

	/**
	 * Constructor
	 */
	public function __construct() {
		// \add_action( 'woocommerce_subscriptions_product_options_pricing', array( $this, 'custom_field' ), 20 );
		\add_action( 'woocommerce_product_after_variable_attributes', array( $this, 'custom_field' ), 20, 3 );
		\add_action( 'woocommerce_save_product_variation', array( $this, 'save_product_tab_content' ), 20, 2 );
	}

	/**
	 * Custom field
	 * Add custom field to product tab
	 *
	 * @param int      $loop loop
	 * @param array    $variation_data variation data
	 * @param \WP_Post $variation variation post object
	 *
	 * @return void
	 */
	public function custom_field( $loop, $variation_data, $variation ): void { // phpcs:ignore
		global $post;
		$post_id      = $post->ID;
		$product      = \wc_get_product( $post_id );
		$product_type = $product->get_type();
		if ( 'variable-subscription' !== $product_type ) {
			return;
		}

		$variation_id        = $variation->ID;
		$host_position_value = \get_post_meta( $variation_id, self::HOST_POSITION_FIELD_NAME, true );
		$host_position_value = empty( $host_position_value ) ? 'jp' : $host_position_value;

		\woocommerce_wp_radio(
			array(
				'id'            => self::HOST_POSITION_FIELD_NAME . '[' . $loop . ']',
				'label'         => '主機種類',
				'wrapper_class' => 'form-row',
				'desc_tip'      => true,
				'description'   => '不同地區的主機，預設為日本',
				'options'       => $this->host_positions,
				'value'         => $host_position_value,
			)
		);

		$linked_site_value = (string) \get_post_meta( $variation_id, self::LINKED_SITE_FIELD_NAME, true );

		\woocommerce_wp_text_input(
			array(
				'id'            => self::LINKED_SITE_FIELD_NAME . '[' . $loop . ']',
				'label'         => '連結的網站 id',
				'wrapper_class' => 'form-row',
				'desc_tip'      => true,
				'description'   => '如果不知道要輸入什麼，請聯繫站長路可',
				'value'         => $linked_site_value,

			)
		);
	}


	/**
	 * Save product tab content
	 *
	 * @param int $variation_id variation id
	 * @param int $loop loop
	 * @return void
	 */
	public function save_product_tab_content( $variation_id, $loop ): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST[ self::HOST_POSITION_FIELD_NAME ][ $loop ] ) ) {
			$host_position = \sanitize_text_field( \wp_unslash( $_POST[ self::HOST_POSITION_FIELD_NAME ][ $loop ] ) );
			\update_post_meta( $variation_id, self::HOST_POSITION_FIELD_NAME, $host_position );
		}

		if ( isset( $_POST[ self::LINKED_SITE_FIELD_NAME ][ $loop ] ) ) {
			$linked_site = \sanitize_text_field( \wp_unslash( $_POST[ self::LINKED_SITE_FIELD_NAME ][ $loop ] ) );
			\update_post_meta( $variation_id, self::LINKED_SITE_FIELD_NAME, $linked_site );
		}
	}
}

new DataTabs();
