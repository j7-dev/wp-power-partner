<?php
/**
 * Shortcode
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Shortcode;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;

/**
 * Class Shortcode
 */
final class Shortcode {


	const CURRENT_USER_SITE_LIST_SHORTCODE = Plugin::SNAKE . '_current_user_site_list';

	/**
	 * Constructor.
	 */
	public function __construct() {
		\add_shortcode( self::CURRENT_USER_SITE_LIST_SHORTCODE, array( $this, self::CURRENT_USER_SITE_LIST_SHORTCODE . '_callback' ) );
	}

	/**
	 * Power partner current user site list callback
	 *
	 * @return string
	 */
	public function power_partner_current_user_site_list_callback(): string {

		return '<div class="' . self::CURRENT_USER_SITE_LIST_SHORTCODE . '"></div>';
	}
}

new Shortcode();
