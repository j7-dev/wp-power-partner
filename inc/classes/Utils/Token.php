<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Utils;

use J7\PowerPartner\Product\SiteSync;

/** Class Token */
abstract class Token {


	/**
	 * Replaces placeholder tokens in a script.
	 *
	 * A script is usually a server provisioning startup script
	 * Tokens are of the format ##TOKEN## and it is expected that
	 * the 'TOKEN' is uppercase.
	 *
	 * As of Version 4.2.5 of WPCD, this function also handles
	 * replacing similar tokens in EMAIL templates.
	 *
	 * @param string $script The full text of the script contents.
	 * @param array  $tokens Key-value array of tokens to replace.
	 *
	 * @return $string The updated script contents
	 */
	public static function replace( $script, $tokens ) {
		$updated_script = $script;

		foreach ( $tokens as $name => $value ) {
			if ( is_array( $value ) || empty( $value ) ) {
				continue;
			}

			$updated_script = str_replace( '##' . strtoupper( $name ) . '##', (string) $value, $updated_script );
		}

		return $updated_script;
	}

	/**
	 * Get order tokens
	 *
	 * @param \WC_Order $order Order
	 * @return array
	 */
	public static function get_order_tokens( \WC_Order $order ): array {
		$customer = $order->get_user();

		$products = [];
		foreach ( $order->get_items() as $item_id => $item ) {
			$product_name = $item->get_name();
			$products[]   = $product_name;
		}
		$products_text = implode( ', ', $products );

		$tokens                         = [];
		$tokens['FIRST_NAME']           = $customer->first_name;
		$tokens['LAST_NAME']            = $customer->last_name;
		$tokens['NICE_NAME']            = $customer->user_nicename;
		$tokens['EMAIL']                = $customer->user_email;
		$tokens['ORDER_ID']             = $order->get_id();
		$tokens['ORDER_ITEMS']          = $products_text;
		$tokens['CHECKOUT_PAYMENT_URL'] = $order->get_checkout_payment_url();
		$tokens['VIEW_ORDER_URL']       = $order->get_view_order_url();
		$tokens['ORDER_STATUS']         = $order->get_status();
		$tokens['ORDER_DATE']           = $order->get_date_created()->format( 'Y-m-d' );

		return $tokens;
	}

	/**
	 * Get subscription tokens
	 *
	 * @param \WC_Subscription $subscription Subscription
	 * @return array
	 */
	public static function get_subscription_tokens( \WC_Subscription $subscription ): array {

		$order = $subscription->get_parent();

		if ( ! $order ) {
			return [];
		}

		$site_responses = $order->get_meta( SiteSync::CREATE_SITE_RESPONSES_META_KEY, true );
		$tokens         = [];
		try {
			$site_responses_arr = \json_decode( $site_responses, true );
			$site_info          = $site_responses_arr['data'] ?? [];
			$tokens['URL']      = $site_info['url'] ?? '';
		} catch ( \Throwable $th ) {
			\J7\WpUtils\Classes\WC::log( $th->getMessage(), 'get_subscription_tokens json_decode failed');
		}

		return $tokens;
	}
}
