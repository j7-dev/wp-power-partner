<?php // phpcs:ignore

declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

if ( ! \class_exists( 'J7\PowerPartner\Admin\Menu\Plugin' ) ) {

	/**
	 * Plugin
	 */
	final class Plugin {

		private static $instance; // phpcs:ignore

		public function __construct() { // phpcs:ignore
			require_once __DIR__ . '/vendor/autoload.php';
			require_once __DIR__ . '/inc/utils/index.php';
			require_once __DIR__ . '/inc/class/class-bootstrap.php';

			new Bootstrap();
		}

		/**
		 * Instance
		 *
		 * @return self
		 */
		public static function instance(): self {
			if ( empty( self::$instance ) ) {
				self::$instance = new self();
			}
			return self::$instance;
		}
	}

	Plugin::instance();
}
