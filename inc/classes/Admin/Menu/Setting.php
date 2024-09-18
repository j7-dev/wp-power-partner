<?php
/**
 * Power Plugin Menu
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use J7\PowerPartner\Plugin;
use J7\PowerPartner\Utils\Base;

/**
 * Class Setting
 */
final class Setting {
	use \J7\WpUtils\Traits\SingletonTrait;

	/**
	 * Constructor
	 */
	public function __construct() {
		\add_action('admin_menu', [ __CLASS__, 'add_menu' ], 99);
	}

	/**
	 * Add menu
	 */
	public static function add_menu(): void {
		\add_submenu_page(
			'powerhouse',
			'Power Partner',
			'Power Partner',
			'manage_options',
			Plugin::$kebab,
			[ __CLASS__, 'render_page' ],
		);
	}

	/**
	 * Render Page
	 *
	 * @return void
	 */
	public static function render_page(): void {
		$id = \substr(Base::APP1_SELECTOR, 1);
		?>
		<style>
			.powerhouse_page_power-partner #wpwrap {
				background-color: #fff;
			}
		</style>
		<?php
		echo "<div id='{$id}' class='mt-8 mb-16 pr-6'></div>";
	}
}
