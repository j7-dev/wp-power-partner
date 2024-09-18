/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

const APP_DOMAIN = 'power_partner_data' as string
export const snake = window?.[APP_DOMAIN]?.env?.SNAKE || 'my_app'
export const appName = window?.[APP_DOMAIN]?.env?.APP_NAME || 'My App'
export const kebab = window?.[APP_DOMAIN]?.env?.KEBAB || 'my-app'
export const app1Selector = window?.[APP_DOMAIN]?.env?.APP1_SELECTOR || 'my_app'
export const app2Selector =
	window?.[APP_DOMAIN]?.env?.APP2_SELECTOR || 'my_app_metabox'
export const apiUrl = window?.wpApiSettings?.root || '/wp-json'
export const ajaxUrl =
	window?.[APP_DOMAIN]?.env?.ajaxUrl || '/wp-admin/admin-ajax.php'
export const siteUrl = window?.[APP_DOMAIN]?.env?.siteUrl || '/'
export const currentUserId = (window?.[APP_DOMAIN]?.env?.userId || 0) as number
export const postId = window?.[APP_DOMAIN]?.env?.postId || '0'
export const permalink = window?.[APP_DOMAIN]?.env?.permalink || '/'
export const apiTimeout = '300000'

// cloud site API
// 正式環境
// export const cloudBaseUrl = 'https://cloud.luke.cafe'
// export const cloudUserName = 'j7.dev.gg'
// export const cloudPassword = 'YQLj xV2R js9p IWYB VWxp oL2E'

// 測試環境
export const cloudBaseUrl = 'http://cloud.test:8080'
export const cloudUserName = 'j7.dev.gg'
export const cloudPassword = 'pcY9 nG3f Q73h Ju5O XZwt pWpe'

export const cloudApiUrl = `${cloudBaseUrl}/wp-json/power-partner-server`
export const LOCALSTORAGE_ACCOUNT_KEY = 'power-partner-account'

export const nonce = window?.[APP_DOMAIN]?.env?.nonce || ''
export const allowed_template_options = (window?.[APP_DOMAIN]?.env
	?.allowed_template_options || []) as {
	[key: string]: string
}

export const partner_id: string = window?.[APP_DOMAIN]?.env?.partner_id || ''
export const disable_site_after_n_days: number =
	window?.[APP_DOMAIN]?.env?.disable_site_after_n_days || 7
