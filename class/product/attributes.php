<?php

declare(strict_types=1);

namespace J7\PowerPartner;

/**
 * 新稱預設的主機產品屬性
 * @see https://discord.com/channels/1148131028246990848/1204425575603896340
 * @see https://stackoverflow.com/questions/29549525/create-new-product-attribute-programmatically-in-woocommerce
 */
final class Attributes
{
	const _host_position_attributes = Utils::SNAKE . '_host_position';
	const _taxonomy = 'pa_' . self::_host_position_attributes;

	public function __construct()
	{
		\add_action('admin_init', [$this, 'create_default_product_attribute'], 10);
		\add_action('admin_init', [$this, 'create_default_terms'], 20);
	}


	public function create_default_product_attribute()
	{
		$attributes = \wc_get_attribute_taxonomies();

		$slugs = \wp_list_pluck($attributes, 'attribute_name');

		if (!in_array(self::_host_position_attributes, $slugs)) {

			$args = array(
				'slug'    => self::_host_position_attributes,
				'name'   => __('主機', Utils::TEXT_DOMAIN),
				'type'    => 'select',
				'orderby' => 'menu_order',
				'has_archives'  => false,
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
			$parent_term = \term_exists($slug, self::_taxonomy);

			if (!$parent_term) {
				\wp_insert_term(
					$name,   // the term
					self::_taxonomy, // the taxonomy
					array(
						'slug'        => $slug,
					)
				);
			}
		}
	}
}

new Attributes();
