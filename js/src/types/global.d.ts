declare global {
  var wpApiSettings: {
    root: string
    nonce: string
  }
  var power_partner_data: {
    env: {
      siteUrl: string
      ajaxUrl: string
      ajaxNonce: string
      userId: string
      postId: string
      permalink: string
      APP_NAME: string
      KEBAB: string
      SNAKE: string
      BASE_URL: string
      RENDER_ID_1: string
      RENDER_ID_2: string
      API_TIMEOUT: string
      nonce: string
      allowed_template_options: {
        [key: string]: string
      }
      partner_id: string
    }
  }
  var linked_lc_product_selector_data: {
    container_id: string
    field_name: string
    cloud_products: {
      [key: string]: {
        name: string
        slug: string
      }
    }
  }
  var wp: {
    blocks: any
    editor: any
  }
}

export {}
