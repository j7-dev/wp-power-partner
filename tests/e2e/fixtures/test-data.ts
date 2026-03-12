/**
 * E2E 測試資料常數
 *
 * 所有測試共用的資料定義。帳密從環境變數讀取，其餘為固定常數。
 * 所有測試用資料前綴 "e2e-" 便於清理。
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
		{
			key: 'next_payment',
			enabled: '1',
			action_name: 'next_payment',
			subject: 'E2E 測試 - 即將扣款通知',
			body: '<p>您的訂閱將於近期自動續訂。</p>',
			days: '3',
			operator: 'before',
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
	domain: 'e2e-test.wpsite.pro',
	password: 'e2e_site_password_123',
	username: 'admin',
	adminEmail: 'e2e_admin@test.local',
	frontUrl: 'https://e2e-test.wpsite.pro',
	adminUrl: 'https://e2e-test.wpsite.pro/wp-admin',
	ip: '127.0.0.1',
}

/** 邊緣案例：數值邊界 */
export const EDGE_NUMBERS = {
	zero: 0,
	negative: -1,
	negativeHigh: -999,
	float: 0.5,
	maxSafe: Number.MAX_SAFE_INTEGER,
	nonExistentId: 999999,
} as const

/** 邊緣案例：字串邊界 */
export const EDGE_STRINGS = {
	empty: '',
	whitespace: '   ',
	longString: 'x'.repeat(10000),
	unicode: '中文測試',
	japanese: '日本語テスト',
	emoji: '🎉🚀💰',
	rtl: 'مرحبا',
	nullByte: 'test\x00inject',
	xssScript: '<script>alert(1)</script>',
	xssImg: '<img onerror=alert(1) src=x>',
	sqlInjection: "' OR 1=1 --",
	sqlDrop: "'; DROP TABLE wp_posts; --",
	pathTraversal: '../../wp-config.php',
} as const

/** 常用 URL 路徑 */
export const URLS = {
	adminDashboard: '/wp-admin/',
	adminPlugins: '/wp-admin/plugins.php',
	adminPartner: '/wp-admin/admin.php?page=power-partner',
	wpLogin: '/wp-login.php',
} as const

/** Timeout 常數（毫秒） */
export const TIMEOUTS = {
	apiResponse: 10_000,
	pageNavigation: 15_000,
	slowTest: 30_000,
} as const

/** 測試用 WPCD 回調資料 */
export const TEST_WPCD_CALLBACK = {
	customerId: '1', // admin 用戶 ID，確保存在
	refOrderId: '999',
	newSiteId: 'e2e-site-abc',
	ipv4: '163.61.60.30',
	domain: 'e2e-mysite.wpsite.pro',
	frontUrl: 'https://e2e-mysite.wpsite.pro',
	adminUrl: 'https://e2e-mysite.wpsite.pro/wp-admin',
	siteUsername: 'admin',
	sitePassword: 'e2e-site-pass-xyz',
} as const
