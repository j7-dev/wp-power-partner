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
		'sg'        => '新加坡',
		'hk'        => '香港',
		'canada'    => '加拿大',
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

		\add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_tab_scripts' ], 20 );
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

		echo '<div class="hidden options_group subscription_pricing show_if_subscription">';

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

		$field_id = self::HOST_POSITION_FIELD_NAME . '[' . $loop . ']';
		$tab_id   = 'host-position-tabs-' . $loop;

		// 定義兩個 tab 的選項
		$tab1_options = [
			'jp'     => '日本',
			'tw'     => '台灣',
			'sg'     => '新加坡',
			'hk'     => '香港',
		];

		$tab2_options = [
			'us_west'   => '美西',
			'uk_london' => '英國倫敦',
			'canada'    => '加拿大',
		];

		// 判斷當前選中的值屬於哪個 tab
		$active_tab = ( isset( $tab1_options[ $host_position_value ] ) ) ? 'tab1' : 'tab2';

		echo '<div class="hidden form-row show_if_variable-subscription power-partner-host-tabs-wrapper" data-loop="' . \esc_attr( $loop ) . '">';
		echo '<div class="power-partner-tabs-container">';
		
		// Tab 按鈕
		echo '<div class="power-partner-tab-buttons">';
		echo '<button type="button" class="power-partner-tab-button' . ( 'tab1' === $active_tab ? 'active' : '' ) . '" data-tab="tab1-' . \esc_attr( $loop ) . '">亞洲地區</button>';
		echo '<button type="button" class="power-partner-tab-button' . ( 'tab2' === $active_tab ? 'active' : '' ) . '" data-tab="tab2-' . \esc_attr( $loop ) . '">其他地區</button>';
		echo '</div>';

		// Tab 1 內容
		echo '<div class="power-partner-tab-content' . ( 'tab1' === $active_tab ? 'active' : '' ) . '" id="tab1-' . \esc_attr( $loop ) . '">';
		\woocommerce_wp_radio(
			[
				'id'            => $field_id . '-tab1',
				'name'          => $field_id,
				'label'         => '主機種類',
				'wrapper_class' => 'form-field [&_ul]:!flex [&_ul]:gap-x-4',
				'desc_tip'      => true,
				'description'   => '不同地區的主機，預設為日本',
				'options'       => $tab1_options,
				'value'         => ( isset( $tab1_options[ $host_position_value ] ) ) ? $host_position_value : '',
			]
		);
		echo '</div>';

		// Tab 2 內容
		echo '<div class="power-partner-tab-content' . ( 'tab2' === $active_tab ? 'active' : '' ) . '" id="tab2-' . \esc_attr( $loop ) . '">';
		\woocommerce_wp_radio(
			[
				'id'            => $field_id . '-tab2',
				'name'          => $field_id,
				'label'         => '主機種類',
				'wrapper_class' => 'form-field [&_ul]:!flex [&_ul]:gap-x-4',
				'desc_tip'      => true,
				'description'   => '不同地區的主機，預設為日本',
				'options'       => $tab2_options,
				'value'         => ( isset( $tab2_options[ $host_position_value ] ) ) ? $host_position_value : '',
			]
		);
		echo '</div>';

		echo '</div>'; // .power-partner-tabs-container
		echo '</div>'; // .power-partner-host-tabs-wrapper

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
	 * Enqueue tab scripts and styles
	 *
	 * @param string $hook current page hook
	 * @return void
	 */
	public function enqueue_tab_scripts( $hook ): void {
		if ( ! in_array( $hook, [ 'post.php', 'post-new.php' ], true ) ) {
			return;
		}

		// 添加內聯 CSS
		$css = '
		.power-partner-host-tabs-wrapper {
			margin-bottom: 20px;
		}
		.power-partner-tabs-container {
			border: 1px solid #ddd;
			border-radius: 4px;
			overflow: hidden;
		}
		.power-partner-tab-buttons {
			display: flex;
			border-bottom: 1px solid #ddd;
			background: #f9f9f9;
		}
		.power-partner-tab-button {
			flex: 1;
			padding: 12px 20px;
			background: transparent;
			border: none;
			border-bottom: 2px solid transparent;
			cursor: pointer;
			font-size: 14px;
			font-weight: 500;
			color: #555;
			transition: all 0.3s ease;
		}
		.power-partner-tab-button:hover {
			background: #f0f0f0;
			color: #2271b1;
		}
		.power-partner-tab-button.active {
			background: #fff;
			color: #2271b1;
			border-bottom-color: #2271b1;
		}
		.power-partner-tab-content {
			display: none;
			padding: 20px;
			background: #fff;
		}
		.power-partner-tab-content.active {
			display: block;
		}
		';

		\wp_add_inline_style( 'woocommerce_admin_styles', $css );

		// 添加內聯 JavaScript
		$js = "
		(function($) {
			$(document).ready(function() {
				// Tab 切換功能
				$(document).on('click', '.power-partner-tab-button', function(e) {
					e.preventDefault();
					var \$button = $(this);
					var tabId = \$button.data('tab');
					var \$wrapper = \$button.closest('.power-partner-tabs-container');
					
					// 更新按鈕狀態
					\$wrapper.find('.power-partner-tab-button').removeClass('active');
					\$button.addClass('active');
					
					// 更新內容顯示
					\$wrapper.find('.power-partner-tab-content').removeClass('active');
					\$wrapper.find('#' + tabId).addClass('active');
				});
				
				// 當 radio 改變時，切換到對應的 tab 並確保同步
				$(document).on('change', '.power-partner-host-tabs-wrapper input[type=\"radio\"]', function() {
					var \$radio = $(this);
					var \$wrapper = \$radio.closest('.power-partner-host-tabs-wrapper');
					var \$tabContent = \$radio.closest('.power-partner-tab-content');
					var tabId = \$tabContent.attr('id');
					var \$button = \$wrapper.find('.power-partner-tab-button[data-tab=\"' + tabId + '\"]');
					var selectedValue = \$radio.val();
					var fieldName = \$radio.attr('name');
					
					// 確保所有相同 name 的 radio 中只有當前選中的被選中
					\$wrapper.find('input[type=\"radio\"][name=\"' + fieldName + '\"]').not(\$radio).prop('checked', false);
					
					// 切換到對應的 tab
					if (\$button.length) {
						\$wrapper.find('.power-partner-tab-button').removeClass('active');
						\$button.addClass('active');
						\$wrapper.find('.power-partner-tab-content').removeClass('active');
						\$tabContent.addClass('active');
					}
				});
			});
		})(jQuery);
		";

		\wp_add_inline_script( 'jquery', $js );
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
