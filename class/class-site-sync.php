<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

/**
 * [ ] - 我要怎麼知道  開一個站  要扣多少點?
 */

class SiteSync
{

    /**
     * 發 API 開站
     *
     * @param array $props
     * @param string $props['site_id']
     * @param string $props['host_position']
     *
     * @return void
     */
    public static function fetch(array $props)
    {
        $args = [
            'body'    => \wp_json_encode([
                'site_id'       => $props[ 'site_id' ],
                'host_position' => $props[ 'host_position' ],
             ]),
            'headers' => [
                'Content-Type' => 'application/json',
             ],
         ];
        $response = \wp_remote_post(Utils::API_URL . '/wp-json/power-partner-server/site-sync', $args);

        try {
            $responseObj = json_decode($response[ 'body' ]);
        } catch (\Throwable $th) {
            //throw $th;
            $responseObj = '';
        }
        if (empty($responseObj)) {
            return 'json_decode($response[body]) Error';
        }
        return $responseObj;
    }

    public function has_enough_money(): bool
    {

        return true;
    }
}
