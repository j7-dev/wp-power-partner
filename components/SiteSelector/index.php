<?php

declare(strict_types=1);

namespace J7\PowerPartner\Components;

use J7\PowerPartner\Utils;

class SiteSelector
{

	public static $instance;

	public static function getInstance()
	{
		if (!isset(self::$instance)) {
			self::$instance = new self();
			return self::$instance;
		} else {
			return self::$instance;
		}
	}

	private function fetchAllSites()
	{
		$args = [
			'headers' => [
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode(Utils::USER_NAME . ':' . Utils::PASSWORD),
			],
		];

		try {
			$response = \wp_remote_get(
				\esc_url_raw(Utils::API_URL . '/wp-json/wpcd/v1/sites'),
				$args
			);

			if ((!\is_wp_error($response)) && (200 === \wp_remote_retrieve_response_code($response))) {
				$responseBody = json_decode($response['body']);
				if (json_last_error() === JSON_ERROR_NONE) {
					\set_transient(Utils::TRANSIENT_KEY, $responseBody, Utils::CACHE_TIME);
					return $responseBody;
				}
			} else {
				ob_start();
				print_r($response);
				\J7\WpToolkit\Utils::debug_log('wp_remote_get [cloud]/wp-json/wpcd/v1/sites Error ' . ob_get_clean());
				return [];
			}
		} catch (\Exception $error) {
			ob_start();
			print_r($error);
			\J7\WpToolkit\Utils::debug_log('wp_remote_get /wp-json/wpcd/v1/sites Error ' . ob_get_clean());
			return [];
		}
	}

	public function getAllSites()
	{
		$sites = \get_transient(Utils::TRANSIENT_KEY);
		if (!empty($sites)) {
			return $sites;
		} else {
			return $this->fetchAllSites();
		}
	}

	public function getTemplateSites(): array
	{
		$sites         = $this->getAllSites();
		$templateSites = array_filter($sites, function ($site) {
			return in_array($site->server_id, Utils::TEMPLATE_SERVER_IDS);
		});

		return $templateSites;
	}

	public function render(?string $defaultValue): string
	{

		$templateSites  = $this->getTemplateSites();
		$post_id        = $_GET['post'];
		$linked_site_id = \get_post_meta($post_id, 'linked_site', true);
		$linked_site    = array_filter($templateSites, function ($site) use ($linked_site_id) {
			return $site->id === (int) $linked_site_id;
		});
		ob_start();
?>
		<?php if (empty($linked_site)) : ?>
			<div>目前沒有連結任何網站</div>
		<?php else :
			$linked_site_obj = reset($linked_site);
		?>
			<p>目前連結的網站: <a href="https://<?= $linked_site_obj->domain; ?>" target="_blank"><?= $linked_site_obj->name; ?></a> <span class="dashicons dashicons-wordpress"></span> <?= $linked_site_obj->wp_version; ?></p>
		<?php endif; ?>
		<select id="linked_site">
			<option value="">請選擇要連結的網站</option>
			<?php foreach ($templateSites as $site) : ?>
				<option value="<?php echo $site->id; ?>" <?= selected($defaultValue, $site->id) ?>><?php echo $site->name; ?></option>
			<?php endforeach; ?>
		</select>

		<p>或直接輸入網站 id</p>
		<input name="linked_site" value="<?= $defaultValue ?>" />
<?php
		// TODO select / input 挑一個就好
		$html = ob_get_clean();
		return $html;
	}
}
