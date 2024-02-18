<?php
declare (strict_types = 1);

namespace J7\PowerPartner\Admin\Menu;

if (!\class_exists('J7\PowerPartner\Admin\Menu\Plugin')) {

    class Plugin
    {
        private static $instance;

        public function __construct()
        {
            require_once __DIR__ . '/vendor/autoload.php';
            require_once __DIR__ . '/inc/utils/index.php';
            require_once __DIR__ . '/inc/class/index.php';

            new Bootstrap();
        }

        public static function instance()
        {
            if (empty(self::$instance)) {
                self::$instance = new self();
            }
            return self::$instance;
        }

    }

    Plugin::instance();
}
