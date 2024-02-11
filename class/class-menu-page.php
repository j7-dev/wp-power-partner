<?php

declare(strict_types=1);

namespace J7\PowerPartner;

class MenuPage
{

	const END_POINT              = '/wp-json/power-partner-server/get-user-id';
	const FORM_ACTION_CONNECT    = 'pp_connect_to_cloud';
	const FORM_ACTION_DISCONNECT = 'pp_disconnect_to_cloud';

	const OPTION_KEY = self::FORM_ACTION_CONNECT . '_user_id';

	public function __construct()
	{
		\add_action('admin_menu', [$this, 'add_menu']);
		\add_action('admin_post_' . self::FORM_ACTION_CONNECT, [$this, self::FORM_ACTION_CONNECT . '_callback']);
		\add_action('admin_post_' . self::FORM_ACTION_DISCONNECT, [$this, self::FORM_ACTION_DISCONNECT . '_callback']);
	}

	public function add_menu(): void
	{
		\add_menu_page(
			Utils::APP_NAME,
			Utils::APP_NAME,
			'manage_options',
			Utils::KEBAB,
			[$this, 'render'],
			'dashicons-admin-site-alt3',
			6
		);
	}

	public function render(): void
	{
		$user_id = \get_option(self::OPTION_KEY);
		if ($user_id) {
			$this->render_connected($user_id);
		} else {
			$this->render_form();
		}
	}
	private function render_form(): void
	{
?>
		<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
			<p>連接您在 cloud.luke.cafe 的帳號</p>
			<input type="hidden" name="action" value="<?= self::FORM_ACTION_CONNECT ?>">
			<input type="email" name="email">
			<input type="password" name="password">
			<?php wp_nonce_field(self::FORM_ACTION_CONNECT); ?>
			<?php submit_button('連接帳號'); ?>
		</form>
	<?php

	}

	private function render_connected(string $user_id): void
	{
	?>
		<p>連結成功，您的用戶 ID 是
			<?= $user_id ?>
		</p>

		<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
			<input type="hidden" name="action" value="<?= self::FORM_ACTION_DISCONNECT ?>">
			<?php wp_nonce_field(self::FORM_ACTION_DISCONNECT); ?>
			<?php submit_button('取消連接帳號'); ?>
		</form>
<?php
	}

	public function pp_connect_to_cloud_callback()
	{
		if (
			!isset($_POST['_wpnonce'])
			|| !\wp_verify_nonce($_POST['_wpnonce'], self::FORM_ACTION_CONNECT)
		) {
			wp_die('Sorry, your nonce did not verify.');
			exit;
		} else {
			$email    = $_POST['email'];
			$password = $_POST['password'];

			$body_params = [
				'email'    => $email,
				'password' => $password,
			];
			$responseObj = $this->authenticate($body_params);

			if (isset($responseObj->data)) {
				$user_id = $responseObj->data->user_id;
				\update_option(self::OPTION_KEY, $user_id);
			}

			\wp_redirect(admin_url('admin.php?page=' . Utils::KEBAB));
		}
	}

	public function pp_disconnect_to_cloud_callback()
	{
		if (
			!isset($_POST['_wpnonce'])
			|| !\wp_verify_nonce($_POST['_wpnonce'], self::FORM_ACTION_DISCONNECT)
		) {
			\wp_die('Sorry, your nonce did not verify.');
			exit;
		} else {
			\delete_option(self::OPTION_KEY);
			\wp_redirect(admin_url('admin.php?page=' . Utils::KEBAB));
		}
	}

	public function authenticate(array $body_params)
	{
		$args = [
			'body'    => $body_params,
			'headers' => [
				'Content-Type' => 'application/x-www-form-urlencoded',
			],
		];
		$response = \wp_remote_post(Utils::API_URL . self::END_POINT, $args);

		if (!isset($response['body'])) {
			return [
				'status'  => 500,
				'message' => '$response["body"] is not set',
				'data'    => null,
			];
		}

		try {
			$responseObj = json_decode($response['body']) ?? [
				'status'  => 500,
				'message' => 'json_decode($response["body"]) is null',
				'data'    => null,
			];
		} catch (\Throwable $th) {
			//throw $th;
			$responseObj = [
				'status'  => 500,
				'message' => 'json_decode($response["body"]) parse error',
				'data'    => null,
			];
		}

		return $responseObj;
	}
}

new MenuPage();
