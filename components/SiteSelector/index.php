<?php

declare(strict_types=1);

namespace J7\PowerPartner\Components;

use J7\PowerPartner\Utils;

final class SiteSelector {

	const ENDPOINT = Utils::API_URL . '/wp-json/power-partner-server/get-template-sites';

	public static $instance;

	public static function get_instance() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
			return self::$instance;
		} else {
			return self::$instance;
		}
	}

	private function fetch_template_sites() {
		$args = array(
			'headers' => array(
				'Content-Type'  => 'application/json',
				'Authorization' => 'Basic ' . \base64_encode( Utils::USER_NAME . ':' . Utils::PASSWORD ),
			),
		);

		try {
			$response = \wp_remote_get(
				\esc_url_raw( self::ENDPOINT ),
				$args
			);

			if ( ( ! \is_wp_error( $response ) ) && ( 200 === \wp_remote_retrieve_response_code( $response ) ) ) {
				$responseBody = json_decode( $response['body'] );
				if ( json_last_error() === JSON_ERROR_NONE ) {
					$sites = $responseBody->data->list ?? array();
					\set_transient( Utils::TRANSIENT_KEY, $sites, Utils::CACHE_TIME );
					return $sites;
				}
			} else {
				ob_start();
				print_r( $response );
				\J7\WpToolkit\Utils::debug_log( 'wp_remote_get ' . self::ENDPOINT . ' ' . ob_get_clean() );
				return array();
			}
		} catch ( \Exception $error ) {
			ob_start();
			print_r( $error );
			\J7\WpToolkit\Utils::debug_log( 'wp_remote_get ' . self::ENDPOINT . ' Error ' . ob_get_clean() );
			return array();
		}
	}

	/**
	 * get_template_sites
	 *
	 * @return array
	 */
	public function get_template_sites() {
		$sites = \get_transient( Utils::TRANSIENT_KEY );
		if ( empty( $sites ) ) {
			$sites = $this->fetch_template_sites();
		}
		if ( ! is_array( $sites ) ) {
			ob_start();
			print_r( $sites );
			\J7\WpToolkit\Utils::debug_log( '$sites !is_array' . ob_get_clean() );
			$sites = array();
		}

		return $sites;
	}

	public function render( string $defaultValue ): string {

		$template_sites = $this->get_template_sites();
		$post_id        = $_GET['post'] ?? '';
		if ( ! empty( $post_id ) ) {
			$linked_site_id = (int) \get_post_meta( $post_id, 'linked_site', true );
			$linked_site    = array_filter(
				$template_sites,
				function ( $site ) use ( $linked_site_id ) {
					return $site->ID === $linked_site_id;
				}
			);
		} else {
			$linked_site = array();
		}

		ob_start();
		?>
		<?php if ( empty( $linked_site ) ) : ?>
			<div>目前沒有連結任何網站</div>
			<?php
		else :
			$linked_site_obj = reset( $linked_site );
			?>
			<p>目前連結的網站: <?php echo $linked_site_obj->post_title; ?></p>
		<?php endif; ?>
		<select id="linked_site">
			<option value="">請選擇要連結的網站</option>
			<?php foreach ( $template_sites as $site ) : ?>
				<option value="<?php echo $site->ID; ?>" <?php echo selected( $defaultValue, $site->ID ); ?>>
					<?php echo $site->post_title; ?></option>
			<?php endforeach; ?>
		</select>

		<p>或直接輸入網站 id</p>
		<input name="linked_site" value="<?php echo $defaultValue; ?>" />
		<?php
		// TODO select / input 挑一個就好
		$html = ob_get_clean();
		return $html;
	}
}
