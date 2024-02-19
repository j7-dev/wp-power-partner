<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

class Api
{

    const USERMETA_IDENTITY = 'connect_app_identity';

    public function __construct()
    {
        \add_action('rest_api_init', [ $this, 'register_user_meta_rest_support' ]);
        \add_action('rest_api_init', [ $this, 'register_api_get_usermeta_identity' ]);
    }

    /**
     * 讓 user_meta `connect_app_identity` 支援 rest api
     *
     * @return void
     */
    public function register_user_meta_rest_support(): void
    {
        \register_meta('user', self::USERMETA_IDENTITY, array(
            'type'              => 'string', // 根据你的实际数据类型调整
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_text_field', // 可选，用于数据清洗
            'auth_callback'     => function () {
                return current_user_can('edit_users');
            },
        ));
    }

    public function register_api_get_usermeta_identity(): void
    {
        \register_rest_route(Utils::KEBAB, "get-usermeta-identity", array(
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_usermeta_identity_callback' ],
            'permission_callback' => function () {
                return current_user_can('edit_users');
            },
        ));
    }

    public function get_usermeta_identity_callback()
    {
        $user_id  = \get_current_user_id();
        $identity = \get_user_meta($user_id, self::USERMETA_IDENTITY, true);

        if (empty($identity)) {
            return \rest_ensure_response([
                'status'  => 100,
                'message' => "identity is empty",
                'data'    => null,
             ]);
        }

        try {
            $identity_array = \json_decode($identity, true);
            return \rest_ensure_response([
                'status'  => 200,
                'message' => "success",
                'data'    => $identity_array,
             ]);
        } catch (\Throwable $th) {
            ob_start();
            print_r($th);
            $th_string = ob_get_clean();
            error_log($th_string);
            return \rest_ensure_response([
                'status'  => 500,
                'message' => "error",
                'data'    => $th_string,
             ]);
        }

    }
}

new Api();
