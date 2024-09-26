<?php
/**
 * Api
 */

declare( strict_types=1 );

namespace J7\PowerPartner\LC;

use J7\PowerPartner\Plugin;
use J7\WpUtils\Classes\WP;
use J7\WpUtils\Classes\General;
use J7\Powerhouse\Api\Base as CloudApi;
use J7\PowerPartner\ShopSubscription;

/**
 * Class Api
 * TODO 新增刪除時也應該要刪除 LC
 */
final class Api {
	use \J7\WpUtils\Traits\SingletonTrait;
	use \J7\WpUtils\Traits\ApiRegisterTrait;

	/**
	 * APIs
	 *
	 * @var array<int, array{endpoint: string, method: string, permission_callback?:callable}>
	 */
	protected $apis = [
		[
			'endpoint' => 'license-codes/update',
			'method'   => 'post',
		],
		[
			'endpoint' => 'license-codes',
			'method'   => 'delete',
		],
		[
			'endpoint'            => 'subscriptions/next-payment',
			'method'              => 'get',
			'permission_callback' => '__return_true',
		],
	];

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_action( 'rest_api_init', [ $this, 'register_api_license_codes' ] );
	}

	/**
	 * Register products API
	 *
	 * @return void
	 */
	public function register_api_license_codes(): void {
		$this->register_apis(
		apis: $this->apis,
		namespace: Plugin::$kebab,
		default_permission_callback: fn() => \current_user_can('manage_options'),
		);
	}



	/**
	 * 更新 License Codes
	 * 可能會修改到訂閱綁定
	 *
	 * @param \WP_REST_Request $request 包含請求參數的 REST 請求對象。
	 * @return \WP_REST_Response 返回包含操作結果的 REST 響應對象。
	 * @phpstan-ignore-next-line
	 */
	public function post_license_codes_update_callback( \WP_REST_Request $request ): \WP_REST_Response {
		$body_params = $request->get_json_params();

		/**
		 * @var array{ids: array<int, int>, post_status: string, domain?: string, product_slug?: string, post_author?:int, subscription_id?:int, customer_id?:int} $body_params
		 */
		$body_params = WP::sanitize_text_field_deep( $body_params );

		$body_params = $this->handle_bind_subscription($body_params);

		if (\is_wp_error($body_params)) {
			return new \WP_REST_Response(
				[
					'code'    => 'bind_subscription_failed',
					'message' => '連結授權碼到訂閱失敗',
					'data'    => [
						'body_params' => $body_params,
					],
				],
				400
			);
		}

		// 發給站長路可變更 LC
		$api_instance = CloudApi::instance();
		$response     = $api_instance->remote_post(
			'license-codes/update',
			$body_params
		);
		$is_error     = \is_wp_error($response);
		if ($is_error) {
			return new \WP_REST_Response(
				[
					'code'    => 'update_license_codes_failed',
					'message' => "更新授權碼到站長路可失敗，{$response->get_error_message()}",
					'data'    => [
						'body_params' => $body_params,
					],
				],
				400
			);
		}

		$body = \wp_remote_retrieve_body($response);
		$data = General::json_parse($body, []);

		return new \WP_REST_Response(
			$data,
			200
			);
	}

	/**
	 * 刪除 License Codes
	 * 可能會修改到訂閱綁定
	 *
	 * @param \WP_REST_Request $request 包含請求參數的 REST 請求對象。
	 * @return \WP_REST_Response 返回包含操作結果的 REST 響應對象。
	 * @phpstan-ignore-next-line
	 */
	public function delete_license_codes_callback( \WP_REST_Request $request ): \WP_REST_Response {
		$body_params = $request->get_json_params();

		/**
		 * @var array{ids: array<int, int>, post_status: string, domain?: string, product_slug?: string, post_author?:int, subscription_id?:int, customer_id?:int} $body_params
		 */
		$body_params = WP::sanitize_text_field_deep( $body_params );
		$lc_ids      = $body_params['ids'] ?? [];
		foreach ($lc_ids as $lc_id) {
			$related_subscription_ids = $this->get_related_subscriptions( (int) $lc_id);
			foreach ($related_subscription_ids as $related_subscription_id) {
				$related_subscription = \wcs_get_subscription($related_subscription_id);
				if ($related_subscription) {
					// 只刪除 lc_id 相同的 meta data
					$related_subscription->delete_meta_data_value('lc_id', $lc_id);
					$related_subscription->save();
				}
			}
		}

		// 發給站長路可變更 LC
		$api_instance = CloudApi::instance();
		$response     = $api_instance->remote_delete(
			'license-codes',
			$body_params
		);
		$is_error     = \is_wp_error($response);
		if ($is_error) {
			return new \WP_REST_Response(
				[
					'code'    => 'delete_license_codes_failed',
					'message' => "刪除授權碼到站長路可失敗，{$response->get_error_message()}",
					'data'    => [
						'body_params' => $body_params,
					],
				],
				400
			);
		}

		$body = \wp_remote_retrieve_body($response);
		$data = General::json_parse($body, []);

		return new \WP_REST_Response(
			$data,
			200
			);
	}


	/**
	 * 處理連結授權碼到訂閱
	 *
	 * @param array{ids: array<int, int>, post_status: string, domain?: string, product_slug?: string, post_author?:int, subscription_id?:int, customer_id?:int, recover?:boolean} $body_params 參數
	 * @return array{ids: array<int, int>, post_status: string, domain?: string, product_slug?: string, post_author?:int, subscription_id?:int, customer_id?:int, recover?:boolean}|\WP_Error 連結成功回傳 $body_params，否則 \WP_Error
	 */
	public function handle_bind_subscription( array $body_params ): array|\WP_Error {
		$lc_ids          = $body_params['ids'] ?? []; // @phpstan-ignore-line
		$subscription_id = $body_params['subscription_id'] ?? null;

		if (!$subscription_id) {
			// 沒有指定綁定訂閱，那就是設定 LC 使用時間，所以要移除 LC 的訂閱綁定
			foreach ($lc_ids as $lc_id) {
				// 這個 lc_id 之前可能綁定再其他訂閱，所以要先找到 有沒有關聯訂閱，有就先解綁
				$related_subscription_ids = $this->get_related_subscriptions( (int) $lc_id);
				foreach ($related_subscription_ids as $related_subscription_id) {
					$related_subscription = \wcs_get_subscription($related_subscription_id);
					if ($related_subscription) {
						// 只刪除 lc_id 相同的 meta data
						$related_subscription->delete_meta_data_value('lc_id', $lc_id);
						$related_subscription->save();
					}
				}
			}
			return $body_params;
		}

		$subscription = \wcs_get_subscription($subscription_id);
		if (!$subscription) {
			return new \WP_Error('subscription_not_found', " #{$subscription_id} 訂閱不存在");
		}

		foreach ($lc_ids as $lc_id) {
			// 這個 lc_id 之前可能綁定再其他訂閱，所以要先找到 有沒有關聯訂閱，有就先解綁
			$related_subscription_ids = $this->get_related_subscriptions( (int) $lc_id);
			foreach ($related_subscription_ids as $related_subscription_id) {
				$related_subscription = \wcs_get_subscription($related_subscription_id);
				if ($related_subscription) {
					// 只刪除 lc_id 相同的 meta data
					$related_subscription->delete_meta_data_value('lc_id', $lc_id);
					$related_subscription->save();
				}
			}
			// 只刪除 lc_id 相同的 meta data
			$subscription->delete_meta_data_value('lc_id', $lc_id);
			$subscription->add_meta_data('lc_id', $lc_id);
			$subscription->save();
		}

		$subscription_status = $subscription->get_status();
		$is_success_status   = in_array($subscription_status, ShopSubscription::$success_statuses, true);
		// 原本 $body_params['post_status'] 是 follow_subscription
		$body_params['post_status'] = $is_success_status ? 'available' : 'expired';

		if ($is_success_status) {
			$body_params['recover'] = true;
		}

		return $body_params;
	}

	/**
	 * 找尋相關的訂閱
	 *
	 * @param int $lc_id license code id
	 * @return array<int, int>
	 */
	public function get_related_subscriptions( int $lc_id ): array {
		$args  = [
			'post_type'      => 'shop_subscription',
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_key'       => 'lc_id',
			'meta_value'     => $lc_id,
		];
		$query = new \WP_Query($args);
		return $query->posts;
	}


	/**
	 * 取得訂閱下次付款日
	 *
	 * @param \WP_REST_Request $request 包含請求參數的 REST 請求對象。
	 * @return \WP_REST_Response|\WP_Error 返回包含操作結果的 REST 響應對象。
	 * @phpstan-ignore-next-line
	 */
	public function get_subscriptions_next_payment_callback( \WP_REST_Request $request ): \WP_REST_Response|\WP_Error {
		$params = $request->get_params();

		$include_required_params = WP::include_required_params($params, [ 'ids' ]);

		if (true !== $include_required_params) {
			return $include_required_params;
		}

		$subscription_ids = $params['ids'];
		if (!is_array($subscription_ids)) {
			return new \WP_Error('invalid_subscription_ids', '訂閱 id 須為陣列');
		}

		$subscription_ids = array_map('intval', $subscription_ids);

		$results = [];
		foreach ($subscription_ids as $subscription_id) {
			$subscription = \wcs_get_subscription($subscription_id);
			if ($subscription) {
				$results[] = [
					'id'   => (int) $subscription_id,
					'time' => $subscription->get_time( 'next_payment' ),
				];
			}
		}

		return new \WP_REST_Response(
			$results,
			200
			);
	}
}
