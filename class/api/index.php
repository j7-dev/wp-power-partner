<?php

declare (strict_types = 1);

namespace J7\PowerPartner;

require_once __DIR__ . '/fetch.php';

class Api
{

    const USERMETA_IDENTITY = 'connect_app_identity';

    public function __construct()
    {
        \add_action('rest_api_init', [ $this, 'register_user_meta_rest_support' ]);
        \add_action('rest_api_init', [ $this, 'register_api_set_partner_id' ]);
    }

    /**
     * 讓 user_meta `connect_app_identity` 支援 rest api
     *
     * @return void
     */
    public function register_user_meta_rest_support()
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

		public function register_api_set_partner_id()
    {
        \register_rest_route(Utils::KEBAB, "partner-id", array(
            'methods'             => 'POST',
            'callback'            => [ $this, 'set_partner_id_callback' ],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ));
    }

		public function set_partner_id_callback($request){
			$body_params         = $request->get_json_params() ?? [  ];
			$partner_id          = $body_params[ 'partner_id' ] ?? '';
			if(!empty($partner_id)){
				\update_option(Utils::SNAKE . '_partner_id', $partner_id);
				return \rest_ensure_response([
					'status'  => 200,
					'message' => "success",
					'data'    => null,
				]);
			}else{
				return \rest_ensure_response([
					'status'  => 100,
					'message' => "partner_id is empty",
					'data'    => null,
				]);
			}
		}
}

new Api();
