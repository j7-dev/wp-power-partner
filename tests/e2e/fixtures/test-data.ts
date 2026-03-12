/**
 * E2E 測試資料常數
 *
 * 所有測試共用的資料定義。帳密從環境變數讀取，其餘為固定常數。
 */

/** WordPress Admin 帳密 */
export const WP_ADMIN = {
	username: process.env.WP_ADMIN_USERNAME || 'admin',
	password: process.env.WP_ADMIN_PASSWORD || 'password',
}

/** API 端點（power-partner namespace） */
export const API = {
	settings: 'power-partner/settings',
	emails: 'power-partner/emails',
	partnerId: 'power-partner/partner-id',
	accountInfo: 'power-partner/account-info',
	customerNotification: 'power-partner/customer-notification',
	linkSite: 'power-partner/link-site',
	manualSiteSync: 'power-partner/manual-site-sync',
	sendSiteCredentialsEmail: 'power-partner/send-site-credentials-email',
	clearTemplateSitesCache: 'power-partner/clear-template-sites-cache',
	subscriptions: 'power-partner/subscriptions',
	changeSubscription: 'power-partner/change-subscription',
	apps: 'power-partner/apps',
	powercloudApiKey: 'power-partner/powercloud-api-key',
	customersBySearch: 'power-partner/customers-by-search',
	customers: 'power-partner/customers',
	licenseCodesUpdate: 'power-partner/license-codes/update',
	licenseCodes: 'power-partner/license-codes',
	subscriptionsNextPayment: 'power-partner/subscriptions/next-payment',
} as const

/** 測試用合作夥伴資料 */
export const TEST_PARTNER = {
	partnerId: 'e2e-test-partner-001',
	encryptedAccountInfo: 'e2e_encrypted_info_abc123',
	allowedTemplateOptions: {
		'tpl-1': 'E2E Template Site A',
		'tpl-2': 'E2E Template Site B',
	},
}

/** 測試用 PowerCloud API Key */
export const TEST_POWERCLOUD_KEY = 'e2e-test-powercloud-key-xyz789'

/** 測試用設定 */
export const TEST_SETTINGS = {
	disableSiteAfterNDays: 7,
	emails: [
		{
			key: 'site_sync',
			enabled: '1',
			action_name: 'site_sync',
			subject: 'E2E 測試 - 您的網站已開通 ##DOMAIN##',
			body: '<p>您好，您的網站已開通。網址: ##FRONTURL##</p>',
			days: '0',
			operator: 'after',
		},
		{
			key: 'subscription_failed',
			enabled: '1',
			action_name: 'subscription_failed',
			subject: 'E2E 測試 - 訂閱付款失敗通知',
			body: '<p>您的訂閱付款失敗，請更新付款方式。</p>',
			days: '0',
			operator: 'after',
		},
	],
}

/** 測試用手動開站參數 */
export const TEST_SITE_SYNC = {
	siteId: '999',
	hostPosition: 'jp',
}

/** 測試用站點帳密 Email 參數 */
export const TEST_SITE_CREDENTIALS = {
	domain: 'e2e-test.example.com',
	password: 'e2e_site_password_123',
	username: 'admin',
	adminEmail: 'e2e_admin@test.local',
	frontUrl: 'https://e2e-test.example.com',
	adminUrl: 'https://e2e-test.example.com/wp-admin',
	ip: '127.0.0.1',
}

/** 常用 URL 路徑 */
export const URLS = {
	adminDashboard: '/wp-admin/',
	adminPlugins: '/wp-admin/plugins.php',
	adminPartner: '/wp-admin/admin.php?page=power-partner',
	wpLogin: '/wp-login.php',
}

/** Timeout 常數 */
export const TIMEOUTS = {
	apiResponse: 10_000,
	pageNavigation: 15_000,
}
