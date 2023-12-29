<?php
declare (strict_types = 1);
namespace J7\PowerPartner;

/*
1. List 顯示開站狀態
2. List 顯示開站時間
 */

class OrderView
{

    const ORDER_META_KEY = 'pp_create_site_responses';
    public function __construct()
    {
        \add_filter('manage_edit-shop_order_columns', [ $this, 'add_order_column' ]);
        \add_action('manage_shop_order_posts_custom_column', [ $this, 'render_order_column' ]);
        \add_action('add_meta_boxes', [ $this, 'add_metabox' ]);

    }

    public function add_order_column(array $columns): array
    {
        $columns[ self::ORDER_META_KEY ] = '開站狀態';
        return $columns;
    }

    public function render_order_column($column): void
    {
        global $post;

        if (self::ORDER_META_KEY === $column) {
            $order_id         = $post->ID;
            $order            = \wc_get_order($order_id);
            $responses_string = $order->get_meta(self::ORDER_META_KEY);

            try {
                $responses = json_decode($responses_string) ?? [  ];
            } catch (\Throwable $th) {
                $responses = [  ];
                echo 'json_decode($responses_string) Error';
            }

            foreach ($responses as $response) {
                $status_text = $response[ 'status' ] == 200 ? '開站成功' : '開站失敗';
                echo "狀態: $status_text<br>";
                echo "網址: abc.com<br>";
            }
        }
    }

    public function add_metabox(): void
    {
        \add_meta_box(self::ORDER_META_KEY . '_metabox', '此訂單的開站狀態', [ $this, self::ORDER_META_KEY . '_callback' ], 'shop_order', 'side', 'high');
    }

    public function pp_create_site_responses_callback(): void
    {
        global $post;
        $order_id         = $post->ID;
        $order            = \wc_get_order($order_id);
        $responses_string = $order->get_meta(self::ORDER_META_KEY);
        try {
            $responses = json_decode($responses_string) ?? [  ];
        } catch (\Throwable $th) {
            $responses = [  ];
            echo 'json_decode($responses_string) Error';
        }
    }

}

new OrderView();
