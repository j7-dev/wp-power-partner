<?php

declare(strict_types=1);

namespace J7\PowerPartner;

use J7\PowerPartner\Components\SiteSelector;
use J7\PowerPartner\SiteSync;

require_once __DIR__ . '/class-site-sync.php';
require_once __DIR__ . '/class-order-view.php';
require_once __DIR__ . '/class-menu-page.php';

/**
 * 新增 product type: power_partner
 */
class Bootstrap
{
	const PRODUCT_TYPE_SLUG = Utils::SNAKE;
	const PRODUCT_TYPE_NAME      = Utils::APP_NAME . ' 產品';
	public function __construct()
	{
		\add_action('add_meta_boxes', [$this, 'add_metabox']);
		\add_filter('product_type_selector', array($this, 'add_product_type_to_dropdown'));
		\add_action("save_post", [$this, "save_metabox"]);
		\add_action('woocommerce_order_status_completed', [$this, 'do_site_sync']);
	}

	public function add_metabox(): void
	{
		\add_meta_box(Utils::SNAKE . '_metabox', '選擇要連結的網站', [$this, Utils::SNAKE . '_callback'], 'product');
	}

	public function add_product_type_to_dropdown(array $types): array
	{
		$types[self::PRODUCT_TYPE_SLUG] = __(self::PRODUCT_TYPE_NAME, Utils::SNAKE);

		return $types;
	}

	public function power_partner_callback(): void
	{
		$post_id = $_GET['post'];
		if (empty($post_id)) {
			return;
		}

		$siteSelector = SiteSelector::getInstance();
		$defaultValue = \get_post_meta($post_id, "linked_site", true) ?? null;
		echo $siteSelector->render($defaultValue);
	}

	public function save_metabox($post_id): void
	{
		$post_type = \get_post_type($post_id);

		if ('product' !== $post_type) {
			return;
		}

		$linked_site = $_POST['linked_site'] ?? null;
		\update_post_meta($post_id, "linked_site", $linked_site);
	}

	public function do_site_sync($order_id): void
	{

		$order     = wc_get_order($order_id);
		$items     = $order->get_items();
		$responses = [];
		foreach ($items as $item) {
			$product_id     = $item->get_product_id();
			$linked_site_id = \get_post_meta($product_id, 'linked_site', true);
			if (empty($linked_site_id)) {
				continue;
			}
			$responseObj   = SiteSync::fetch((int) $linked_site_id);
			$responses[] = [
				'status'  => $responseObj->status,
				'message' => $responseObj->message,
				'data'    => $responseObj->data,
			];
		}
		ob_start();
		print_r($responses);
		$responses_string = ob_get_clean();
		// 把網站建立成功與否的資訊存到訂單的 meta data

		$order->add_order_note($responses_string);

		$order->update_meta_data(Utils::ORDER_META_KEY, json_encode($responses));

		$order->save();
	}
}
