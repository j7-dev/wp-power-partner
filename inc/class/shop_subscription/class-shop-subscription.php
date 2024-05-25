<?php
/**
 * ShopSubscription 相關
 */

declare (strict_types = 1);

namespace J7\PowerPartner\ShopSubscription;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Api\Fetch;
use J7\PowerPartner\Product\Product;
use J7\PowerPartner\Utils\Base;


/**
 * Class ShopSubscription
 *
 * Status:
 * wc-active 已啟用
 * wc-cancelled 已取消
 * wc-expired 已過期
 * wc-on-hold 保留
 * wc-pending-cancel 待取消
 */
final class ShopSubscription {

	const IS_POWER_PARTNER_SUBSCRIPTION  = 'is_' . Plugin::SNAKE;
	const LAST_FAILED_TIMESTAMP_META_KEY = Plugin::SNAKE . '_last_failed_timestamp';
	const POST_TYPE                      = 'shop_subscription';

	/**
	 * Success statuses
	 *
	 * @var array
	 */
	public static $success_statuses = array( 'wc-active' );

	/**
	 * Failed statuses
	 *
	 * @var array
	 */
	public static $failed_statuses = array( 'wc-cancelled', 'wc-on-hold', 'wc-pending-cancel' );


	/**
	 * Not failed statuses
	 *
	 * @var array
	 */
	public static $not_failed_statuses = array( 'wc-active', 'wc-expired' );

	/**
	 * All statuses
	 *
	 * @var array
	 */
	public static $all_statuses = array( 'wc-active', 'wc-cancelled', 'wc-expired', 'wc-on-hold', 'wc-pending-cancel' );


	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action( 'transition_post_status', array( $this, 'subscription_failed' ), 10, 3 );
		\add_action( 'wcs_create_subscription', array( $this, 'add_meta' ), 10, 1 );
		\add_action( 'add_meta_boxes', array( $this, 'add_meta_box' ) );
		\add_action( 'save_post', array( $this, 'save' ) );
		\add_filter( 'manage_edit-' . self::POST_TYPE . '_columns', array( $this, 'add_order_column' ), 99, 1 );
		\add_action( 'manage_' . self::POST_TYPE . '_posts_custom_column', array( $this, 'render_order_column' ) );
	}

	/**
	 * Subscription failed
	 * 如果用戶續訂失敗，則停用訂單網站
	 *
	 * @param string   $new_status new status
	 * @param string   $old_status old status
	 * @param \WP_POST $post post
	 * @return void
	 */
	public function subscription_failed( $new_status, $old_status, $post ): void {

		// 如果不是訂閱 就不處理
		if ( self::POST_TYPE !== $post?->post_type ) {
			return;
		}

		$subscription_id               = $post?->ID;
		$is_power_partner_subscription = \get_post_meta( $subscription_id, self::IS_POWER_PARTNER_SUBSCRIPTION, true );
		// 如果不是 power partner 網站訂閱 就不處理
		if ( ! $is_power_partner_subscription ) {
			return;
		}

		// 從 [已啟用] 變成 [已取消] 或 [保留] 等等  就算失敗， [已過期] 不算
		$is_subscription_failed = ( ! in_array( $new_status, self::$not_failed_statuses, true ) ) && in_array( $old_status, self::$success_statuses, true );

		// 如果訂閱沒失敗 就不處理，並且清除上次失敗的時間
		if ( ! $is_subscription_failed ) {
			\delete_post_meta( $subscription_id, self::LAST_FAILED_TIMESTAMP_META_KEY );
			return;
		}

		// 找到連結的訂單， post_parent 是訂單編號
		$linked_site_ids = self::get_linked_site_ids( $subscription_id );

		$order_id = \wp_get_post_parent_id( $subscription_id );

		// disable 訂單網站
		foreach ( $linked_site_ids as $site_id ) {
			Fetch::disable_site( $site_id, "訂閱失敗，狀態從 {$old_status} 轉為 {$new_status}，訂閱ID: {$subscription_id}，上層訂單號碼: {$order_id}" );
		}

		// 記錄失敗時間，因為要搭配 CRON 判斷過了多久然後發信
		\update_post_meta( $subscription_id, self::LAST_FAILED_TIMESTAMP_META_KEY, time() );
	}

	/**
	 * Add post meta
	 * 加入 post meta 識別是網站訂閱
	 *
	 * @param \WC_Subscription $subscription subscription
	 * @return void
	 */
	public function add_meta( $subscription ) {
		$subscription    = \wcs_get_subscription( $subscription );
		$subscription_id = $subscription?->get_id();
		\update_post_meta( $subscription_id, self::IS_POWER_PARTNER_SUBSCRIPTION, true );
	}

	/**
	 * Sync post meta
	 * 因為 v1 沒有對 subscription 加上 IS_POWER_PARTNER_SUBSCRIPTION 的 meta
	 * 所以要做一次同步
	 *
	 * @deprecated version 2.0.0
	 *
	 * @return void
	 */
	public static function sync_post_meta() {
		$major_ver = Plugin::$version[0];
		if ( $major_ver <= 2 ) {
			$subscription_ids = \get_posts(
				array(
					'post_type'   => self::POST_TYPE,
					'post_status' => 'any',
					'numberposts' => -1,
					'fields'      => 'ids',
				)
			);
			foreach ( $subscription_ids as $subscription_id ) {
				$subscription_top_order    = \get_post_parent( $subscription_id );
				$subscription_top_order_id = $subscription_top_order?->ID;
				$create_site_response      = \get_post_meta( $subscription_top_order_id, Product::CREATE_SITE_RESPONSES_META_KEY, true );
				$is_power_partner_order    = ! empty( $create_site_response );
				if ( $is_power_partner_order ) {
					\update_post_meta( $subscription_id, self::IS_POWER_PARTNER_SUBSCRIPTION, true );
				}
			}
		}
	}

	/**
	 * Get linked site ids
	 * 取得訂單網站的 site id
	 *
	 * @param int $subscription_id subscription id
	 * @return array
	 */
	public static function get_linked_site_ids( $subscription_id ): array {
		self::compatible_linked_site_ids( $subscription_id );

		$subscription = \wcs_get_subscription( $subscription_id );

		if ( ! $subscription ) {
			return array();
		}
		$meta_data       = $subscription?->get_meta( Product::LINKED_SITE_IDS_META_KEY, false );
		$linked_site_ids = array();
		foreach ( $meta_data as $meta ) {
			$meta_id                     = $meta->__get( 'id' );
			$value                       = $meta->__get( 'value' );
			$linked_site_ids[ $meta_id ] = $value;
		}

		return is_array( $linked_site_ids ) ? array_unique( $linked_site_ids ) : array();
	}

	/**
	 * 這邊是為了處理舊的資料，舊的資料是直接存一個 array
	 *
	 * @deprecated version 2.0.0
	 * @param int $subscription_id subscription id
	 * @return void
	 */
	public static function compatible_linked_site_ids( $subscription_id ): void {
		$subscription = \wcs_get_subscription( $subscription_id );

		if ( ! $subscription ) {
			return;
		}

		$old_meta_data = $subscription?->get_meta( Product::LINKED_SITE_IDS_META_KEY, true );
		if ( is_array( $old_meta_data ) ) {
			foreach ( $old_meta_data as $old_site_id ) {
				$subscription?->add_meta_data( Product::LINKED_SITE_IDS_META_KEY, $old_site_id );
			}
			$subscription?->save();
		}
		$to_delete_mids = array();

		$meta_data = $subscription?->get_meta( Product::LINKED_SITE_IDS_META_KEY, false );
		foreach ( $meta_data as $meta ) {
			$meta_id = $meta->__get( 'id' );
			$value   = $meta->__get( 'value' );
			if ( is_array( $value ) ) {
				$to_delete_mids[] = $meta_id;
			}
		}

		foreach ( $to_delete_mids as $mid ) {
			Base::delete_post_meta_by_mid( $mid );
		}
	}

	/**
	 * Update linked site ids
	 * 更新訂單網站的 site id
	 *
	 * @param int   $subscription_id subscription id
	 * @param array $linked_site_ids linked site ids
	 * @return bool
	 */
	public static function update_linked_site_ids( $subscription_id, $linked_site_ids ) {
		$subscription = \wcs_get_subscription( $subscription_id );

		$old_linked_site_ids = self::get_linked_site_ids( $subscription_id );

		$to_add_sites    = array_diff( $linked_site_ids, $old_linked_site_ids );
		$to_delete_sites = array_diff( $old_linked_site_ids, $linked_site_ids );

		foreach ( $to_add_sites as $to_add_site ) {
			$subscription?->add_meta_data( Product::LINKED_SITE_IDS_META_KEY, $to_add_site );
		}

		foreach ( $to_delete_sites as $to_delete_site ) {
			$mid = array_search( $to_delete_site, $old_linked_site_ids );
			if ( $mid ) {
				Base::delete_post_meta_by_mid( $mid );
			}
		}

		$subscription?->save();

		$subscription?->add_order_note(
			\sprintf(
				/* translators: %s: linked site ids */
				__( '更新了此訂閱的連結的網站 id: %1$s -> %2$s', 'power_partner' ),
				\implode( ', ', $old_linked_site_ids ),
				\implode( ', ', $linked_site_ids )
			)
		);

		return true;
	}

	/**
	 * Change linked site ids
	 * 變更訂閱的 site ids
	 *
	 * @param int   $subscription_id subscription id
	 * @param array $linked_site_ids linked site ids
	 * @return bool
	 */
	public static function change_linked_site_ids( $subscription_id, $linked_site_ids ) {
		try {
			self::remove_linked_site_ids( $linked_site_ids );
			self::update_linked_site_ids( $subscription_id, $linked_site_ids );

			return true;
		} catch ( \Throwable $th ) {
			return false;
		}
	}

	/**
	 * Remove linked site ids
	 * 移除訂單網站的 site id
	 *
	 * @param array $linked_site_ids site ids to remove
	 * @return bool
	 */
	public static function remove_linked_site_ids( $linked_site_ids ): bool {
		try {
			// 移除原本連結的訂閱
			$subscription_ids_to_check = array();

			foreach ( $linked_site_ids as $site_id ) {
				$args = array(
					'post_type'      => self::POST_TYPE,
					'posts_per_page' => -1,
					'post_status'    => 'any',
					'fields'         => 'ids',
					'meta_key'       => Product::LINKED_SITE_IDS_META_KEY,
					'meta_value'     => $site_id,
				);

				$subscription_ids          = \get_posts( $args );
				$subscription_ids_to_check = array(
					...$subscription_ids_to_check,
					...$subscription_ids,
				);
			}

			foreach ( $subscription_ids_to_check as $subscription_id ) {
				$old_linked_site_ids    = self::get_linked_site_ids( $subscription_id );
				$filter_linked_site_ids = array_filter(
					$old_linked_site_ids,
					function ( $old_site_id ) use ( $linked_site_ids ) {
						return ! in_array( $old_site_id, $linked_site_ids );
					}
				);

				self::update_linked_site_ids( $subscription_id, $filter_linked_site_ids );
			}

			return true;
		} catch ( \Throwable $th ) {

			return false;
		}
	}

	/**
	 * Add meta box
	 * 加入 meta box
	 *
	 * @param string $post_type post type
	 * @return void
	 */
	public function add_meta_box( $post_type ) {
		$post_types = array( self::POST_TYPE );

		if ( in_array( $post_type, $post_types, true ) ) {
			\add_meta_box(
				Product::LINKED_SITE_IDS_META_KEY . '_meta_box',
				__( '此訂閱連結的網站 id', 'power_partner' ),
				array( $this, 'render_meta_box_content' ),
				$post_type,
				'advanced',
				'high'
			);
		}
	}

	/**
	 * Render meta box content
	 * 顯示 meta box 內容
	 *
	 * @param \WP_Post $post post
	 * @return void
	 */
	public function render_meta_box_content( $post ) {

		echo '只能移除，不能新增';

		$linked_site_ids = self::get_linked_site_ids( $post?->ID );

		$options = array();

		foreach ( $linked_site_ids as $site_id ) {
			$options[ $site_id ] = '#' . $site_id;
		}

		\wp_nonce_field( Product::LINKED_SITE_IDS_META_KEY . '_action', Product::LINKED_SITE_IDS_META_KEY . '_nonce' );

		\woocommerce_wp_select(  // 使用方法 & 設定項可以看 WooCommerce 代碼
			array(
				'id'                => Product::LINKED_SITE_IDS_META_KEY,
				'name'              => Product::LINKED_SITE_IDS_META_KEY . '[]',  // 🚩這邊要加上 []，不然 POST 給後端，會抓到 single string 而不是 array
				'style'             => 'width:25rem;',
				'class'             => '',
				'label'             => '',
				'value'             => $linked_site_ids, // 這邊就放你從後端拿的資料
				'options'           => $options, // key => value 的陣列
				'custom_attributes' => array(
					'multiple'         => 'multiple', // 🚩 這是要給 selectWoo 抓的
					'data-allow-clear' => 'true', // select2 設定項，請自行查閱
				),
			)
		);
		?>
<script>
	(function($){
	$('#<?php echo Product::LINKED_SITE_IDS_META_KEY;//phpcs:ignore ?>').selectWoo();
})(jQuery)
</script>
		<?php
	}

	/**
	 * Save
	 * 儲存
	 *
	 * @param int $post_id post id
	 * @return void
	 */
	public function save( $post_id ) {

		$nonce = $_POST[ Product::LINKED_SITE_IDS_META_KEY . '_nonce' ] ?? ''; // phpcs:ignore
		$linked_site_ids = $_POST[ Product::LINKED_SITE_IDS_META_KEY ] ?? []; // phpcs:ignore

		// Verify that the nonce is valid.
		if ( ! \wp_verify_nonce( $nonce, Product::LINKED_SITE_IDS_META_KEY . '_action' ) ) {
			return;
		}

		if ( ! is_array( $linked_site_ids ) ) {
			$linked_site_ids = array();
		}

		$old_linked_site_ids = self::get_linked_site_ids( $post_id );

		if ( $old_linked_site_ids === $linked_site_ids ) {
			return;
		}

		self::update_linked_site_ids( $post_id, $linked_site_ids );
	}

	/**
	 * Add order column.
	 *
	 * @param array $columns Columns.
	 * @return array
	 */
	public function add_order_column( array $columns ): array {
		$columns[ Product::LINKED_SITE_IDS_META_KEY ] = '綁定的網站 ids';
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

		if ( Product::LINKED_SITE_IDS_META_KEY === $column ) {
			$subscription_id = $post->ID;
			$linked_site_ids = self::get_linked_site_ids( $subscription_id );

			echo \esc_html( implode( ', ', $linked_site_ids ) );

		}
	}
}

new ShopSubscription();
