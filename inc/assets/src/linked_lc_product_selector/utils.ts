// @ts-nocheck
export const selector = '.linked_lc_product_selector'


export type TCloudProduct = {
	slug: string
	label: string
}
export const cloud_products:TCloudProduct[] = window?.linked_lc_product_selector_data?.cloud_products || []
