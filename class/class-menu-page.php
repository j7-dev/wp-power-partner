<?php
declare (strict_types = 1);
namespace J7\PowerPartner;

class MenuPage
{
    public function __construct()
    {
        \add_action('admin_menu', [ $this, 'add_menu' ]);
    }

    public function add_menu(): void
    {
        \add_menu_page(
            'Power Partner',
            'Power Partner',
            'manage_options',
            'power-partner',
            [ $this, 'render' ],
            'dashicons-admin-site-alt3',
            6
        );
    }

    public function render(): void
    {}
    public function render_form(): void
    {
        ?>
form
			<?php

    }
}

new MenuPage();
