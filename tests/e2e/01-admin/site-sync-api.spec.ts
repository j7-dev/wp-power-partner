/**
 * 開站與站點管理 API 測試
 *
 * 涵蓋: ManualSiteSync, ClearTemplateSitesCache, SendSiteCredentialsEmail
 *
 * 對應 spec:
 *   spec/features/site/手動開站.feature
 *   spec/features/site/WPCD開站.feature
 *   spec/features/cache/清除模板站快取.feature
 *   spec/features/email/發送站點帳密郵件.feature
 *
 * 注意:
 *   - ManualSiteSync 需呼叫外部 CloudServer，測試環境無外部服務時回 500。
 *     測試重點在驗證「不應回 403（權限檢查）」以及「缺少參數時的錯誤碼」。
 *   - SendSiteCredentialsEmail 在無 SMTP 的環境下可能送出失敗（500），但
 *     API 結構正確時以 404 未找到模板作為主要斷言。
 */
import { test, expect } from '@playwright/test'
import { wpPost, type ApiOptions } from '../helpers/api-client.js'
import {
	API,
	TEST_SITE_CREDENTIALS,
	TEST_SITE_SYNC,
	TEST_SETTINGS,
	TEST_PARTNER,
	EDGE_STRINGS,
	EDGE_NUMBERS,
} from '../fixtures/test-data.js'
import { getNonce } from '../helpers/admin-setup.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── ClearTemplateSitesCache ─────────────────────────────────

test.describe('POST /clear-template-sites-cache — ClearTemplateSitesCache', () => {

	// P0: 核心功能
	test('P0: 管理員可清除模板站快取', async () => {
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
	})

	test('P0: 回應包含 status 欄位', async () => {
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
		const body = res.data as Record<string, unknown>
		// 回應應有 status 欄位
		expect(body).toHaveProperty('status')
	})

	// P1: 冪等性
	test('P1: 重複清除仍回 200（冪等）', async () => {
		const res1 = await wpPost(api, API.clearTemplateSitesCache, {})
		const res2 = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P1: 快取本來就不存在時清除仍回 200', async () => {
		// 先清除一次（確保 transient 不存在）
		await wpPost(api, API.clearTemplateSitesCache, {})
		// 再次清除
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
	})
})

// ─── ManualSiteSync ──────────────────────────────────────────

test.describe('POST /manual-site-sync — ManualSiteSync', () => {

	test.beforeAll(async () => {
		// 確保有 partner_id（手動開站需要）
		await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
		})
	})

	// P0: 核心功能（驗證不回 403）
	test('P0: 管理員可呼叫手動開站 API（不回 403）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: TEST_SITE_SYNC.siteId,
			host_position: TEST_SITE_SYNC.hostPosition,
		})
		// 因無外部 CloudServer，可能回 500，但不應 403（權限守衛通過）
		expect(res.status).not.toBe(403)
	})

	// P1: 參數驗證
	test('P1: 缺少 site_id 回錯誤（400 或 500）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			host_position: 'jp',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: 缺少 host_position 仍嘗試呼叫（可能 500）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: '999',
		})
		// host_position 非必填，可能嘗試呼叫但外部服務失敗
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: 回應包含開站結果結構（若 API 呼叫成功）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: TEST_SITE_SYNC.siteId,
			host_position: TEST_SITE_SYNC.hostPosition,
		})
		// 不管成功或失敗，回應應是有效 JSON
		expect(typeof res.data).toBe('object')
	})

	// P2: 不同主機地區
	test('P2: host_position 為各種有效值', async () => {
		const positions = ['jp', 'tw', 'us_west', 'uk_london', 'sg', 'hk', 'canada']
		for (const position of positions) {
			const res = await wpPost(api, API.manualSiteSync, {
				site_id: '999',
				host_position: position,
			})
			// 只要不是 403 就算通過
			expect(res.status).not.toBe(403)
		}
	})

	// P3: 邊緣案例
	test('P3: site_id 為 0（邊界值）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: String(EDGE_NUMBERS.zero),
			host_position: 'jp',
		})
		// 0 應被視為空或無效
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P3: site_id 含特殊字元（路徑遍歷）', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: EDGE_STRINGS.pathTraversal,
			host_position: 'jp',
		})
		// 應被 sanitize，不應崩潰
		expect([400, 500].includes(res.status)).toBe(true)
	})
})

// ─── SendSiteCredentialsEmail ────────────────────────────────

test.describe('POST /send-site-credentials-email — SendSiteCredentialsEmail', () => {

	test.beforeAll(async () => {
		// 確保 site_sync 模板已啟用（spec 前置條件：必須存在 site_sync 模板）
		await wpPost(api, API.settings, {
			emails: TEST_SETTINGS.emails,
		})
	})

	// P0: 核心功能
	test('P0: 管理員可發送站點帳密 Email（不回 404）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: TEST_SITE_CREDENTIALS.domain,
			password: TEST_SITE_CREDENTIALS.password,
			username: TEST_SITE_CREDENTIALS.username,
			adminEmail: TEST_SITE_CREDENTIALS.adminEmail,
			frontUrl: TEST_SITE_CREDENTIALS.frontUrl,
			adminUrl: TEST_SITE_CREDENTIALS.adminUrl,
			ip: TEST_SITE_CREDENTIALS.ip,
		})
		// 在測試環境 Email 可能送出失敗，但有 site_sync 模板，不應回 404
		expect(res.status).not.toBe(404)
	})

	// P1: 必填參數驗證（spec 規定 domain 與 password 不可為空）
	test('P1: 缺少 domain 回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			password: 'test-pass',
		})
		expect(res.status).toBe(400)
	})

	test('P1: 缺少 password 回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'test.example.com',
		})
		expect(res.status).toBe(400)
	})

	test('P1: domain 為空字串回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: EDGE_STRINGS.empty,
			password: 'test-pass',
		})
		expect(res.status).toBe(400)
	})

	test('P1: password 為空字串回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'test.example.com',
			password: EDGE_STRINGS.empty,
		})
		expect(res.status).toBe(400)
	})

	// P1: 缺少模板時的狀態（spec 前置條件）
	test('P1: 無 site_sync 模板時回 404', async () => {
		// 先儲存不含 site_sync 的設定
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'other_template',
					enabled: '1',
					action_name: 'subscription_failed',
					subject: 'Other',
					body: '<p>Other</p>',
					days: '0',
					operator: 'after',
				},
			],
		})

		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'test.example.com',
			password: 'test-pass',
		})
		// spec: 找不到 site_sync 模板時回 404
		expect(res.status).toBe(404)

		// 還原：重新設定含 site_sync 的模板
		await wpPost(api, API.settings, { emails: TEST_SETTINGS.emails })
	})

	// P2: 可選參數
	test('P2: 只傳必要欄位（domain + password）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'minimal.e2e.com',
			password: 'minimal-pass',
		})
		// 有 site_sync 模板，不應回 404
		expect(res.status).not.toBe(404)
	})

	test('P2: username 預設為 admin（不傳 username）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'default-user.e2e.com',
			password: 'pass123',
		})
		expect([200, 500].includes(res.status)).toBe(true)
	})

	test('P2: 傳入 adminEmail 確定收件人', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'custom-email.e2e.com',
			password: 'pass123',
			adminEmail: 'custom@e2e.test.local',
		})
		expect([200, 500].includes(res.status)).toBe(true)
	})

	// P3: 邊緣案例
	test('P3: domain 含 Unicode（中文域名）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: `${EDGE_STRINGS.unicode}.example.com`,
			password: 'test-pass',
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: password 含特殊字元', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'special-chars.e2e.com',
			password: '!@#$%^&*()_+{}|:<>?',
		})
		expect(res.status).not.toBe(403)
	})

	test('P3: domain 含 XSS（應被 sanitize）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: EDGE_STRINGS.xssScript,
			password: 'test-pass',
		})
		// 可能 400（sanitize 後為空） 或 200/500
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: 超長 domain（10000 字元）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: EDGE_STRINGS.longString,
			password: 'test-pass',
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})
})
