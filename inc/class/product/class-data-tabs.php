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
		\add_action( 'woocommerce_product_after_variable_attributes', array( $this, 'custom_field' ), 20 );
		\add_action( 'woocommerce_process_product_meta', array( $this, 'save_product_tab_content' ) );
	}

	/**
	 * Custom field
	 *
	 * @return void
	 */
	public function custom_field(): void {
		global $post;
		$post_id             = $post->ID;
		$host_position_value = \get_post_meta( $post_id, self::HOST_POSITION_FIELD_NAME, true );
		$host_position_value = empty( $host_position_value ) ? 'jp' : $host_position_value;

		\woocommerce_wp_radio(
			array(
				'id'      => self::HOST_POSITION_FIELD_NAME,
				'name'    => self::HOST_POSITION_FIELD_NAME,
				'label'   => '主機種類',
				'options' => $this->host_positions,
				'value'   => $host_position_value,
			)
		);

		$linked_site_value = (string) \get_post_meta( $post_id, self::LINKED_SITE_FIELD_NAME, true );

		\woocommerce_wp_text_input(
			array(
				'id'          => self::LINKED_SITE_FIELD_NAME,
				'name'        => self::LINKED_SITE_FIELD_NAME,
				'value'       => $linked_site_value,
				'label'       => '連結的網站 id',
				'desc_tip'    => true,
				'description' => '如果不知道要輸入什麼，請聯繫站長路可',
			)
		);
	}


	/**
	 * Save product tab content
	 *
	 * @param int $post_id post id
	 * @return void
	 */
	public function save_product_tab_content( $post_id ): void {
		// phpcs:disable WordPress.Security.NonceVerification.Missing
		if ( ! isset( $_POST[ self::HOST_POSITION_FIELD_NAME ] ) ) {
			$host_position = \sanitize_text_field( \wp_unslash( $_POST[ self::HOST_POSITION_FIELD_NAME ] ) );
			\update_post_meta( $post_id, self::HOST_POSITION_FIELD_NAME, $host_position );
		}

		if ( isset( $_POST[ self::LINKED_SITE_FIELD_NAME ] ) ) {
			$linked_site = \sanitize_text_field( \wp_unslash( $_POST[ self::LINKED_SITE_FIELD_NAME ] ) );
			\update_post_meta( $post_id, self::LINKED_SITE_FIELD_NAME, $linked_site );
		}
	}
}

new DataTabs();
