<?php
declare (strict_types = 1);
namespace J7\PowerPartner;

/**
 * [ ] - 我要怎麼知道  開一個站  要扣多少點?
 */

class SiteSync
{
    const API_URL = 'https://cloud.luke.cafe';
    public static function fetch(int $site_id)
    {
        $args = [
            'body'    => [
                'site_id' => $site_id,
             ],
            'headers' => [
                'Content-Type' => 'multipart/form-data;',
             ],
         ];
        $response = wp_remote_post(self::API_URL . '/wp-json/power-partner-server/site-sync', $args);

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
