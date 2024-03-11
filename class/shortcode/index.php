<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

class Shortcode
{

    const CURRENT_USER_SITE_LIST_SHORTCODE = Utils::SNAKE . '_current_user_site_list';

    public function __construct()
    {
      \add_shortcode(self::CURRENT_USER_SITE_LIST_SHORTCODE, [$this, self::CURRENT_USER_SITE_LIST_SHORTCODE . '_callback']);
    }

		public function power_partner_current_user_site_list_callback():string{

			return '<div class="' . self::CURRENT_USER_SITE_LIST_SHORTCODE . '"></div>';
		}

}

new Shortcode();
