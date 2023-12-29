<?php
declare (strict_types = 1);
namespace J7\PowerPartner;

class MenuPage extends Utils
{

    public function __construct()
    {
        \add_action('admin_menu', [ $this, 'add_menu' ]);
        \add_action('admin_post_' . self::FORM_ACTION, [ $this, self::FORM_ACTION . '_callback' ]);
    }

    public function add_menu(): void
    {
        \add_menu_page(
            self::APP_NAME,
            self::APP_NAME,
            'manage_options',
            self::KEBAB,
            [ $this, 'render' ],
            'dashicons-admin-site-alt3',
            6
        );
    }

    public function render(): void
    {
        $this->render_form();
    }
    private function render_form(): void
    {
        ?>
				<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
<p>連接您在 cloud.luke.cafe 的帳號</p>
<input type="hidden" name="action" value="<?=self::FORM_ACTION?>">
<input type="email" name="email">
<input type="password" name="password">
<?php wp_nonce_field(self::FORM_ACTION);?>
					<?php submit_button('連接帳號');?>
				</form>
			<?php

    }

    public function pp_link_to_cloud_callback()
    {
        if (!isset($_POST[ '_wpnonce' ])
            || !wp_verify_nonce($_POST[ '_wpnonce' ], self::FORM_ACTION)
        ) {
            print 'Sorry, your nonce did not verify.';
            exit;
        } else {
            $email    = $_POST[ 'email' ];
            $password = $_POST[ 'password' ];
            // process form data

            wp_redirect(admin_url('admin.php?page=' . self::KEBAB));
        }
    }
}

new MenuPage();
