<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

class Bootstrap
{
    public function __construct()
    {
        require_once __DIR__ . '/admin/index.php';
        require_once __DIR__ . '/api/index.php';
        require_once __DIR__ . '/class-order-view.php';
        require_once __DIR__ . '/product/index.php';
        require_once __DIR__ . '/shortcode/index.php';
    }
}
