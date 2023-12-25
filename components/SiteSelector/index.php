<?php
declare (strict_types = 1);
namespace J7\PowerPartner\Components;

class SiteSelector
{
    const API_URL            = 'https://cloud.luke.cafe';
    const USER_NAME          = 'j7.dev.gg';
    const PASSWORD           = 'YQLj xV2R js9p IWYB VWxp oL2E';
    const TEMPLATE_SERVER_ID = 2202;
    const CACHE_TIME         = 28800;

    private $sites = [  ];
    public static $instance;

    public function __construct()
    {
        $this->fetchAllSites();
    }

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
                'Authorization' => 'Basic ' . \base64_encode(self::USER_NAME . ':' . self::PASSWORD),
             ],
         ];

        try {
            $response = \wp_remote_get(
                \esc_url_raw(self::API_URL . '/wp-json/wpcd/v1/sites'),
                $args
            );

            error_log('⭐⭐ wp_remote_get: 執行了');
            if ((!\is_wp_error($response)) && (200 === \wp_remote_retrieve_response_code($response))) {
                $responseBody = json_decode($response[ 'body' ]);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $this->sites = $responseBody;
                    return $responseBody;
                }
            }
        } catch (\Exception $ex) {
            //Handle Exception.
            return [  ];
        }
    }

    public function getAllSites()
    {
        $sites = $this->sites;
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
            // 根据属性进行过滤条件，这里假设你想要保留 propertyName 为 'value1' 的对象
            return $site->server_id === self::TEMPLATE_SERVER_ID;
        });

        return $templateSites;

    }

    public function render(?string $defaultValue): string
    {

        $templateSites  = $this->getTemplateSites();
        $post_id        = $_GET[ 'post' ];
        $linked_site_id = \get_post_meta($post_id, 'linked_site', true);
        $linked_site    = array_filter($templateSites, function ($site) use ($linked_site_id) {
            return $site->id === (int) $linked_site_id;
        });
        ob_start();
        ?>

					<?php if (empty($linked_site)): ?>
						<div>目前沒有連結任何網站</div>
					<?php else:
            $linked_site_obj = reset($linked_site);
            ?>
													<div>目前連結的網站: <a href="https://<?=$linked_site_obj->domain;?>" target="_blank"><?=$linked_site_obj->name;?></a>  <span class="dashicons dashicons-wordpress"></span> <?=$linked_site_obj->wp_version;?></div>
												<?php endif;?>

					<select name="linked_site" id="linked_site" style="margin-top: 1rem;">
										<option value="">請選擇要連結的網站</option>
										<?php foreach ($templateSites as $site):
            $selected = $site->id === (int) $defaultValue ? 'selected' : '';
            ?>
																									<option value="<?php echo $site->id; ?>" <?=$selected?>><?php echo $site->name; ?></option>
																								<?php endforeach;?>
					</select>

				<?php

        $html = ob_get_clean();
        return $html;
    }
}
