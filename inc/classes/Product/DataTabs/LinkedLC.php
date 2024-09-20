<?php
/**
 * 在 wp-admin 商品編輯頁
 * 對 wc-tabs 新增欄位
 * 只對 簡單訂閱商品 & 可變訂閱商品 新增
 * 連結的 License Code 商品
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product\DataTabs;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;
use J7\WpUtils\Classes\General;
use J7\PowerPartner\Bootstrap;

/**
 * Class LinkedLC
 */
final class LinkedLC {
	use \J7\WpUtils\Traits\SingletonTrait;

	const LC_PRODUCT_SELECTOR                        = 'linked_lc_product_selector';
	const FIELD_NAME                                 = 'linked_lc_products';
	const CLOUD_PRODUCTS_TRANSIENT_KEY               = 'pp_cloud_products';
	const CLEAR_CLOUD_PRODUCTS_TRANSIENT_ACTION_NAME = 'clear_' . self::CLOUD_PRODUCTS_TRANSIENT_KEY;
	const CACHE_TIME                                 = 24 * HOUR_IN_SECONDS;

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'admin_enqueue_scripts', [ __CLASS__, 'enqueue_scripts' ], 30, 1 );

		\add_action( 'woocommerce_product_options_general_product_data', [ __CLASS__, 'custom_field_subscription' ], 30, 1 );
		\add_action( 'woocommerce_process_product_meta', [ __CLASS__, 'save_subscription' ], 20 );

		\add_action( 'woocommerce_product_after_variable_attributes', [ __CLASS__, 'custom_field_variable_subscription' ], 20, 3 );
		\add_action( 'woocommerce_save_product_variation', [ __CLASS__, 'save_variable_subscription' ], 20, 2 );

		// 清除 transient callback
		\add_action( 'admin_post_' . self::CLEAR_CLOUD_PRODUCTS_TRANSIENT_ACTION_NAME, [ __CLASS__, 'clear_cloud_products_transient_callback' ] );
	}

	/**
	 * 輸出連接授權碼的欄位
	 *
	 * @return void
	 */
	public static function custom_field_subscription(): void {
		global $post;
		$product_id                 = $post->ID;
		$default_linked_lc_products = \get_post_meta($product_id, self::FIELD_NAME, true);
		if (!\is_array($default_linked_lc_products)) {
			$default_linked_lc_products = [];
		}
		$default_linked_lc_products_json_encode = htmlspecialchars(\json_encode($default_linked_lc_products), ENT_QUOTES, 'UTF-8'); // @phpstan-ignore-line

		// 清除快取的連結授權碼商品
		$action_url = \add_query_arg( 'action', self::CLEAR_CLOUD_PRODUCTS_TRANSIENT_ACTION_NAME, \admin_url( 'admin-post.php?' ) );

		// render 商品 & 授權碼數量選擇器
		printf(
		/*html*/"
			<div class='flex items-center py-4 show_if_subscription hidden'>
				<div class='w-[150px] pl-3 mt-2 self-start'>關聯授權碼</div>
				<div class='%1\$s'>
					<div class='%2\$s' data-field_name='%3\$s' data-default_linked_lc_products='%4\$s'></div>
				</div>
				<a href='%5\$s' class='button self-start ml-2'>清除快取</a>
			</div>
			",
		'w-[calc((100%-180px)/2)]',
		self::LC_PRODUCT_SELECTOR,
		self::FIELD_NAME,
		$default_linked_lc_products_json_encode,
		$action_url
		);
	}

	/**
	 * Save for subscription
	 *
	 * @param int $product_id product id
	 * @return void
	 */
	public static function save_subscription( $product_id ): void {
		// phpcs:disable
		if ( isset( $_POST[ self::FIELD_NAME ] ) ) {
			$linked_lc_products = $_POST[ self::FIELD_NAME ];
			$formatted_linked_lc_products = self::format_linked_lc_products($linked_lc_products);
			\update_post_meta( $product_id, self::FIELD_NAME, $formatted_linked_lc_products );
		}
		// phpcs:enable
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
	 * @phpstan-ignore-next-line
	 */
	public static function custom_field_variable_subscription( $loop, $variation_data, $variation ): void { // phpcs:ignore

		$variation_id               = $variation->ID;
		$default_linked_lc_products = \get_post_meta($variation_id, self::FIELD_NAME, true);
		if (!\is_array($default_linked_lc_products)) {
			$default_linked_lc_products = [];
		}

		$default_linked_lc_products_json_encode = htmlspecialchars(\json_encode($default_linked_lc_products), ENT_QUOTES, 'UTF-8'); // @phpstan-ignore-line
		// 商品 & 授權碼數量選擇器
		printf(
		/*html*/"
			<div class='clear-both show_if_variable-subscription hidden'>
				<div class=''>關聯授權碼</div>
				<div class='%1\$s'>
					<div class='%2\$s' data-field_name='%3\$s' data-default_linked_lc_products='%4\$s'></div>
				</div>
			</div>
			",
		'w-full',
		self::LC_PRODUCT_SELECTOR,
		self::FIELD_NAME . '[' . $loop . ']',
		$default_linked_lc_products_json_encode
		);
	}

	/**
	 * Save for variable subscription
	 *
	 * @param int $variation_id variation id
	 * @param int $loop loop
	 * @return void
	 */
	public static function save_variable_subscription( $variation_id, $loop ): void {
		// phpcs:disable
		if ( isset( $_POST[ self::FIELD_NAME ][ $loop ] ) ) {
			$linked_lc_products = $_POST[ self::FIELD_NAME ][ $loop ];
			$formatted_linked_lc_products = self::format_linked_lc_products($linked_lc_products);
			\update_post_meta( $variation_id, self::FIELD_NAME, $formatted_linked_lc_products );
		}
		// phpcs:enable
	}

	/**
	 * 載入 linked_lc_product_selector 組件 js
	 * 只在商品編輯介面載入
	 *
	 * @param string $hook 目前頁面
	 * @return void
	 */
	public static function enqueue_scripts( $hook ): void {

		if (!in_array($hook, [ 'post.php', 'post-new.php' ], true)) {
			return;
		}

		\wp_enqueue_script(
		self::LC_PRODUCT_SELECTOR,
		Plugin::$url . '/inc/assets/dist/linked_lc_product_selector.js',
		[ 'jquery' ],
		Plugin::$version,
		[
			'strategy'  => 'defer',
			'in_footer' => true,
		]
		);

		$cloud_products = self::get_cloud_products();

		\wp_localize_script(
			self::LC_PRODUCT_SELECTOR,
			self::LC_PRODUCT_SELECTOR . '_data',
			[
				'cloud_products' => $cloud_products,
			]
		);
	}

	/**
	 * 取得站長路可授權碼商品
	 *
	 * @return array<array{slug: string, label: string, rate: float}>
	 */
	public static function get_cloud_products(): array {
		/**
		 * @var array<array{slug: string, label: string, rate: float}>|false $cloud_products
		 */
		$cloud_products = \get_transient(self::CLOUD_PRODUCTS_TRANSIENT_KEY);
		if (false !== $cloud_products) {
			return $cloud_products;
		}

		$args = [
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Bootstrap::instance()->username . ':' . Bootstrap::instance()->psw ), // phpcs:ignore
			],
			'timeout' => 120,
		];

		$api_url = Bootstrap::instance()->base_url . '/wp-json/power-partner-server/license-codes/products';
		$api_url = \add_query_arg(
			[
				'user_id' => \get_current_user_id(),
			],
			$api_url
			);

		$response = \wp_remote_get( $api_url, $args );

		if (\is_wp_error($response)) {
			\set_transient(self::CLOUD_PRODUCTS_TRANSIENT_KEY, [], self::CACHE_TIME);
			return [];
		}

		$body = \wp_remote_retrieve_body($response);

		$default_data_value = [
			[
				'slug'  => '',
				'label' => '請選擇',
				'rate'  => null,
			],
		];
		/**
		 * @var array<array{slug: string, label: string, rate: float}> $data
		 */
		$data = General::json_parse($body, $default_data_value);

		\set_transient(self::CLOUD_PRODUCTS_TRANSIENT_KEY, $data, self::CACHE_TIME);

		return $data;
	}


	/**
	 * 格式化連結的授權碼商品
	 * 避免重複
	 *
	 * @param array<array{product_slug: string, quantity: string}> $linked_lc_products 原始資料
	 * @return array<array{product_slug: string, quantity: string}> 格式化後的資料
	 */
	public static function format_linked_lc_products( array $linked_lc_products ): array {
		$key_value_linked_lc_products = [];
		foreach ($linked_lc_products as $linked_lc_product) {
			$array_keys = array_keys($key_value_linked_lc_products);
			if (!in_array($linked_lc_product['product_slug'], $array_keys, true)) {
				$key_value_linked_lc_products[ $linked_lc_product['product_slug'] ] = $linked_lc_product['quantity'];
			} else {
				$key_value_linked_lc_products[ $linked_lc_product['product_slug'] ] += $linked_lc_product['quantity'];
			}
		}

		$formatted_linked_lc_products = [];
		foreach ($key_value_linked_lc_products as $product_slug => $quantity) {
			$formatted_linked_lc_products[] = [
				'product_slug' => $product_slug,
				'quantity'     => $quantity,
			];
		}
		return $formatted_linked_lc_products;
	}

	/**
	 * 清除快取的授權碼商品
	 *
	 * @return void
	 */
	public static function clear_cloud_products_transient_callback(): void {
		\delete_transient(self::CLOUD_PRODUCTS_TRANSIENT_KEY);
		$current_url = \wp_get_referer();
		\wp_safe_redirect( $current_url );
		exit;
	}
}
