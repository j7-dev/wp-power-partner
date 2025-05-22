<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Test;

/** Retry */
final class Retry {
	use \J7\WpUtils\Traits\SingletonTrait;

	/** Constructor */
	public function __construct() {

		// 禁止 retry
		\add_filter('wcs_default_retry_rules', fn( $rules ) => [], 1000);
	}
}
