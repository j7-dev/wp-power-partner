/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

const APP_DOMAIN = 'connect_app_data' as string
export const snake = window?.[APP_DOMAIN]?.env?.SNAKE || 'my_app'
export const appName = window?.[APP_DOMAIN]?.env?.APP_NAME || 'My App'
export const kebab = window?.[APP_DOMAIN]?.env?.KEBAB || 'my-app'
export const renderId1 = window?.[APP_DOMAIN]?.env?.RENDER_ID_1 || 'my_app'
export const renderId2 =
  window?.[APP_DOMAIN]?.env?.RENDER_ID_2 || 'my_app_metabox'
export const apiUrl = window?.wpApiSettings?.root || '/wp-json'
export const ajaxUrl =
  window?.[APP_DOMAIN]?.env?.ajaxUrl || '/wp-admin/admin-ajax.php'
export const siteUrl = window?.[APP_DOMAIN]?.env?.siteUrl || '/'
export const currentUserId = window?.[APP_DOMAIN]?.env?.userId || '0'
export const postId = window?.[APP_DOMAIN]?.env?.postId || '0'
export const permalink = window?.[APP_DOMAIN]?.env?.permalink || '/'
export const apiTimeout = '30000'

// cloud site API

export const cloudBaseUrl = 'https://cloud.luke.cafe' // https://cloud.luke.cafe  http://cloudlukecafe.local
export const cloudApiUrl = `${cloudBaseUrl}/wp-json/power-partner-server`
export const cloudUserName = 'j7.dev.gg'
export const cloudPassword = 'YQLj xV2R js9p IWYB VWxp oL2E'
