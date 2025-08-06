<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Subscription\Utils;

use J7\PowerPartner\Product\SiteSync;

/** Base  */
abstract class Base {

	/**
	 * 是否是 Power Partner 開站訂閱
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return bool
	 */
	public static function is_site_sync( \WC_Subscription $subscription ): bool {
		$is_power_partner_subscription = $subscription->get_meta( SiteSync::LINKED_SITE_IDS_META_KEY, true );
		return (bool) $is_power_partner_subscription;
	}
}
