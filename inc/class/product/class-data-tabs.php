<?php
/**
 * 在 wp-admin 商品編輯頁
 * 對 wc-tabs 新增欄位
 * 只對 簡單訂閱商品 & 可變訂閱商品 新增
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Utils;

/**
 * Class DataTabs
 */
final class DataTabs {
	const HOST_POSITION_FIELD_NAME = Utils::SNAKE . '_host_position';
	const LINKED_SITE_FIELD_NAME   = Utils::SNAKE . '_linked_site';
	const PRODUCT_TYPE_SLUG        = Utils::SNAKE;
	const DEFAULT_HOST_POSITION    = 'jp';


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
		\add_action( 'woocommerce_product_options_general_product_data', array( $this, 'custom_field_subscription' ), 20, 1 );
		\add_action( 'woocommerce_process_product_meta', array( $this, 'save_subscription' ), 20 );

		\add_action( 'woocommerce_product_after_variable_attributes', array( $this, 'custom_field_variable_subscription' ), 20, 3 );
		\add_action( 'woocommerce_save_product_variation', array( $this, 'save_variable_subscription' ), 20, 2 );
	}

	/**
	 * Custom field for subscription
	 * Add custom field to product tab
	 *
	 * @return void
	 */
	public function custom_field_subscription(): void {
		global $post;
		$product_id          = $post->ID;
		$host_position_value = \get_post_meta( $product_id, self::HOST_POSITION_FIELD_NAME, true );
		$host_position_value = empty( $host_position_value ) ? self::DEFAULT_HOST_POSITION : $host_position_value;

		echo '<div class="options_group subscription_pricing show_if_subscription hidden">';
		\woocommerce_wp_radio(
			array(
				'id'            => self::HOST_POSITION_FIELD_NAME,
				'label'         => '主機種類',
				'wrapper_class' => 'form-field',
				'desc_tip'      => true,
				'description'   => '不同地區的主機，預設為日本',
				'options'       => $this->host_positions,
				'value'         => $host_position_value,
			)
		);

		$linked_site_value = (string) \get_post_meta( $product_id, self::LINKED_SITE_FIELD_NAME, true );

		\woocommerce_wp_text_input(
			array(
				'id'            => self::LINKED_SITE_FIELD_NAME,
				'label'         => '連結的網站 id',
				'wrapper_class' => 'form-field',
				'desc_tip'      => true,
				'description'   => '如果不知道要輸入什麼，請聯繫站長路可',
				'value'         => $linked_site_value,
			)
		);

		echo '</div>';
	}

	/**
	 * Save for subscription
	 *
	 * @param int $product_id product id
	 * @return void
	 */
	public function save_subscription( $product_id ): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( isset( $_POST[ self::HOST_POSITION_FIELD_NAME ] ) ) {
			$host_position = \sanitize_text_field( \wp_unslash( $_POST[ self::HOST_POSITION_FIELD_NAME ] ) );
			\update_post_meta( $product_id, self::HOST_POSITION_FIELD_NAME, $host_position );
		}

		if ( isset( $_POST[ self::LINKED_SITE_FIELD_NAME ] ) ) {
			$linked_site = \sanitize_text_field( \wp_unslash( $_POST[ self::LINKED_SITE_FIELD_NAME ] ) );
			\update_post_meta( $product_id, self::LINKED_SITE_FIELD_NAME, $linked_site );
		}
	}

	/**
	 * Custom field for variable subscription
	 * Add custom field to product tab
	 *
	 * @param int      $loop loop
	 * @param array    $variation_data variation data
	 * @param \WP_Post $variation variation post object
	 *
	 * @return void
	 */
	public function custom_field_variable_subscription( $loop, $variation_data, $variation ): void { // phpcs:ignore
		$variation_id        = $variation->ID;
		$host_position_value = \get_post_meta( $variation_id, self::HOST_POSITION_FIELD_NAME, true );
		$host_position_value = empty( $host_position_value ) ? self::DEFAULT_HOST_POSITION : $host_position_value;

		\woocommerce_wp_radio(
			array(
				'id'            => self::HOST_POSITION_FIELD_NAME . '[' . $loop . ']',
				'label'         => '主機種類',
				'wrapper_class' => 'form-row show_if_variable-subscription hidden',
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
				'wrapper_class' => 'form-row show_if_variable-subscription hidden',
				'desc_tip'      => true,
				'description'   => '如果不知道要輸入什麼，請聯繫站長路可',
				'value'         => $linked_site_value,
			)
		);
	}


	/**
	 * Save for variable subscription
	 *
	 * @param int $variation_id variation id
	 * @param int $loop loop
	 * @return void
	 */
	public function save_variable_subscription( $variation_id, $loop ): void {
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
