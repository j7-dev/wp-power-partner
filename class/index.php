<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

class Bootstrap
{
    public function __construct()
    {
        require_once __DIR__ . '/admin/index.php';
        require_once __DIR__ . '/api/index.php';
        require_once __DIR__ . '/class-site-sync.php';
        require_once __DIR__ . '/class-order-view.php';
        require_once __DIR__ . '/class-menu-page.php';
        require_once __DIR__ . '/product/index.php';
    }
}
