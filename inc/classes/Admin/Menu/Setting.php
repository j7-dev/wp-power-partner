<?php
/**
 * Power Plugin Menu
 */

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

use J7\PowerPartner\Utils\Base;

/**
 * Class Setting
 */
final class Setting {

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
