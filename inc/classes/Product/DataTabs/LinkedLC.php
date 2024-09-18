<?php
/**
 * 在 wp-admin 商品編輯頁
 * 對 wc-tabs 新增欄位
 * 只對 簡單訂閱商品 & 可變訂閱商品 新增
 * 連結的 License Code 商品
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product\DataTabs;

/**
 * Class LinkedLC
 */
final class LinkedLC {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'woocommerce_product_options_general_product_data', [ $this, 'custom_field_subscription' ], 30, 1 );
		// \add_action( 'woocommerce_process_product_meta', [ $this, 'save_subscription' ], 20 );

		// \add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'custom_field_variable_subscription' ], 20, 3 );
		// \add_action( 'woocommerce_save_product_variation', [ $this, 'save_variable_subscription' ], 20, 2 );
	}

	/**
	 * 輸出連接授權碼的欄位
	 *
	 * @return void
	 */
	public static function custom_field_subscription(): void {

		// TEST
		$cloud_products = [
			'65536' => 'Cloud 1000',
			'65537' => 'Cloud 2000',
			'65538' => 'Cloud 3000',
			'65539' => 'Cloud 4000',
			'65540' => 'Cloud 5000',
			'65541' => 'Cloud 6000',
			'65542' => 'Cloud 7000',
			'65543' => 'Cloud 8000',
			'65544' => 'Cloud 9000',
		];

		foreach ( $cloud_products as $product_id => $product_name ) {

			\woocommerce_wp_select(
			[
				'id'            => 'linked_lc_product_id',
				'label'         => '連結的授權商品 id',
				'wrapper_class' => 'form-field',
				'desc_tip'      => false,
				// 'description'   => '<a href="' . $action_url . '"><button type="button" class="button">清除快取</button></a>',
				'value'         => $linked_site_value,
				'options'       => [ '' => '請選擇' ] + self::$allowed_template_options,
			]
			);
		}
	}
}
