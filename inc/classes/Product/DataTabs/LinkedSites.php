<?php
/**
 * 在 wp-admin 商品編輯頁
 * 對 wc-tabs 新增欄位
 * 只對 簡單訂閱商品 & 可變訂閱商品 新增
 * 連結的開站網站
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Product\DataTabs;

use J7\PowerPartner\Api\Connect;
use J7\PowerPartner\Api\Fetch;

/**
 * Class LinkedSites
 */
final class LinkedSites {
	use \J7\WpUtils\Traits\SingletonTrait;

	const HOST_POSITION_FIELD_NAME = 'power_partner_host_position';
	const LINKED_SITE_FIELD_NAME   = 'power_partner_linked_site';
	const PRODUCT_TYPE_SLUG        = 'power_partner';
	const DEFAULT_HOST_POSITION    = 'jp';

	const CLEAR_ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_ACTION_NAME = 'clear_' . Fetch::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY;


	/**
	 * @var array<string, string> slug, name
	 */
	public $host_positions = [
		'jp'        => '日本',
		'tw'        => '台灣',
		'us_west'   => '美西',
		'uk_london' => '英國倫敦',
	];

	/**
	 * Constructor
	 */
	public function __construct() {

		// \add_action( 'woocommerce_subscriptions_product_options_pricing', array( $this, 'custom_field' ), 20 );
		\add_action( 'woocommerce_product_options_general_product_data', [ $this, 'custom_field_subscription' ], 20, 1 );
		\add_action( 'woocommerce_process_product_meta', [ $this, 'save_subscription' ], 20 );

		\add_action( 'woocommerce_product_after_variable_attributes', [ $this, 'custom_field_variable_subscription' ], 20, 3 );
		\add_action( 'woocommerce_save_product_variation', [ $this, 'save_variable_subscription' ], 20, 2 );

		\add_action( 'admin_post_' . self::CLEAR_ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_ACTION_NAME, [ $this, 'clear_allowed_template_options_transient_callback' ] );
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

		$partner_id = \get_option( Connect::PARTNER_ID_OPTION_NAME );

		if ( ! empty( $partner_id ) ) {
			\woocommerce_wp_radio(
				[
					'id'            => self::HOST_POSITION_FIELD_NAME,
					'label'         => '主機種類',
					'wrapper_class' => 'form-field [&_ul]:!flex [&_ul]:gap-x-4',
					'desc_tip'      => true,
					'description'   => '不同地區的主機，預設為日本',
					'options'       => $this->host_positions,
					'value'         => $host_position_value,
				]
			);

			self::render_linked_site_subscription( $product_id );
		} else {
			\woocommerce_wp_note(
				[
					'label'         => '連結的網站 id',
					'wrapper_class' => 'form-field',
					'message'       => '<span style="font-size:1rem;">🚩 請先連結你在 https://cloud.luke.cafe/ 的帳號，可以前往 <a target="_blank" href="' . \admin_url( 'admin.php?page=power-partner' ) . '">Power Partner 分頁</a> 進行連結，才可以設定開站</span>',
				]
			);
		}

		echo '</div>';
	}

	/**
	 * Render linked site for subscription product
	 * 顯示連結的網站
	 *
	 * @param  int $product_id product id
	 *
	 * @return void
	 */
	public static function render_linked_site_subscription( $product_id ) {

		$linked_site_value = (string) \get_post_meta( $product_id, self::LINKED_SITE_FIELD_NAME, true );

		$action_url = \add_query_arg( 'action', self::CLEAR_ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_ACTION_NAME, \admin_url( 'admin-post.php?' ) );

		\woocommerce_wp_select(
			[
				'id'            => self::LINKED_SITE_FIELD_NAME,
				'label'         => '連結的網站 id',
				'wrapper_class' => 'form-field',
				'desc_tip'      => false,
				'description'   => '<a href="' . $action_url . '"><button type="button" class="button">清除快取</button></a>',
				'value'         => $linked_site_value,
				'options'       => [ '' => '請選擇' ] + Fetch::get_allowed_template_options(),
			]
		);

		echo '<p class="description" style="
		padding-left: 155px;
		top: -10px;
		position: relative;
		">如果想要更多模板站，請聯繫站長路可，只有當站長幫你調整模板站後，才有需要清除快取，否則無須清除。</p>';
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
	 * @phpstan-ignore-next-line
	 */
	public function custom_field_variable_subscription( $loop, $variation_data, $variation ): void { // phpcs:ignore
		$variation_id        = $variation->ID;
		$host_position_value = \get_post_meta( $variation_id, self::HOST_POSITION_FIELD_NAME, true );
		$host_position_value = empty( $host_position_value ) ? self::DEFAULT_HOST_POSITION : $host_position_value;

		\woocommerce_wp_radio(
			[
				'id'            => self::HOST_POSITION_FIELD_NAME . '[' . $loop . ']',
				'label'         => '主機種類',
				'wrapper_class' => 'form-row show_if_variable-subscription hidden [&_ul]:!flex [&_ul]:gap-x-4',
				'desc_tip'      => true,
				'description'   => '不同地區的主機，預設為日本',
				'options'       => $this->host_positions,
				'value'         => $host_position_value,
			]
		);

		self::render_linked_site_variable_subscription( $variation_id, $loop );
	}

	/**
	 * Render linked site for variable subscription product
	 * 顯示連結的網站
	 *
	 * @param  int $variation_id variation id
	 * @param  int $loop loop
	 *
	 * @return void
	 */
	public static function render_linked_site_variable_subscription( $variation_id, $loop ) {

		$linked_site_value = (string) \get_post_meta( $variation_id, self::LINKED_SITE_FIELD_NAME, true );

		$action_url = \add_query_arg( 'action', self::CLEAR_ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_ACTION_NAME, \admin_url( 'admin-post.php?' ) );

		\woocommerce_wp_select(
			[
				'id'            => self::LINKED_SITE_FIELD_NAME . '[' . $loop . ']',
				'label'         => '連結的網站 id',
				'wrapper_class' => 'form-field form-row form-row-first show_if_variable-subscription hidden',
				'desc_tip'      => false,
				'description'   => '如果想要更多模板站，請聯繫站長路可',
				'value'         => $linked_site_value,
				'options'       => [ '' => '請選擇' ] + Fetch::get_allowed_template_options(),
			]
		);

		\woocommerce_wp_note(
			[
				'label'         => '只有當站長幫你調整模板站後，才有需要清除快取，否則無須清除。',
				'wrapper_class' => 'form-field form-row form-row-last show_if_variable-subscription hidden',
				'message'       => '<br /><a href="' . $action_url . '"><button type="button" class="button" style="height: 38px;
				margin-top: 2px;">清除快取</button></a>',
			]
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



	/**
	 * Clear allowed template options transient callback
	 *
	 * @return void
	 */
	public function clear_allowed_template_options_transient_callback() {
		\delete_transient( Fetch::ALLOWED_TEMPLATE_OPTIONS_TRANSIENT_KEY );
		\wp_safe_redirect( \admin_url( 'edit.php?post_type=product' ) );
		exit;
	}
}
