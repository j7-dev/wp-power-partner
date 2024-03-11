<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Product;

use J7\PowerPartner\Utils;

/**
 * 新稱預設的主機產品屬性
 * @see https://discord.com/channels/1148131028246990848/1204425575603896340
 * @see https://stackoverflow.com/questions/29549525/create-new-product-attribute-programmatically-in-woocommerce
 */
final class Attributes
{
    const HOST_POSITION_ATTRIBUTES = Utils::SNAKE . '_host_position';
    const TAXONOMY                 = 'pa_' . self::HOST_POSITION_ATTRIBUTES;

    public function __construct()
    {
        \add_action('admin_init', [ $this, 'create_default_product_attribute' ], 10);
        \add_action('admin_init', [ $this, 'create_default_terms' ], 20);
    }

    public function create_default_product_attribute()
    {
        $attributes = \wc_get_attribute_taxonomies();

        $slugs = \wp_list_pluck($attributes, 'attribute_name');

        if (!in_array(self::HOST_POSITION_ATTRIBUTES, $slugs)) {

            $args = array(
                'slug'         => self::HOST_POSITION_ATTRIBUTES,
                'name'         => __('主機', Utils::TEXT_DOMAIN),
                'type'         => 'select',
                'orderby'      => 'menu_order',
                'has_archives' => false,
            );

            $result = \wc_create_attribute($args);
        }
    }

    public function create_default_terms()
    {
        $default_terms = [
            'jp' => '日本',
            'tw' => '台灣',
         ];

        foreach ($default_terms as $slug => $name) {
            $parent_term = \term_exists($slug, self::TAXONOMY);

            if (!$parent_term) {
                \wp_insert_term(
                    $name, // the term
                    self::TAXONOMY, // the taxonomy
                    array(
                        'slug' => $slug,
                    )
                );
            }
        }
    }
}

new Attributes();
