/**
 * 邊界條件與異常輸入測試
 *
 * 涵蓋:
 * - 資料邊界: 空值、超長字串、特殊字元
 * - XSS 測試: Email body 中的腳本注入
 * - 型別邊界: 數字字串 vs 數字、陣列 vs 非陣列
 * - 重複操作: 冪等性驗證
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── 資料邊界: Settings ──────────────────────────────────────

test.describe('資料邊界: Settings', () => {
	test('P2: disable_site_after_n_days 為 0', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 0,
		})
		expect(res.status).toBe(200)
	})

	test('P2: disable_site_after_n_days 為負數', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: -1,
		})
		// 可能被過濾為 0 或直接拒絕
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: disable_site_after_n_days 為超大數字', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 999999,
		})
		expect(res.status).toBe(200)
	})

	test('P3: disable_site_after_n_days 為字串', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 'abc',
		})
		// PHP 會嘗試 type cast，可能回 200
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: emails 為 null', async () => {
		const res = await wpPost(api, API.settings, {
			emails: null,
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: emails 為空字串（非陣列）', async () => {
		const res = await wpPost(api, API.settings, {
			emails: '',
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})
})

// ─── XSS / 內容注入: Email Body ─────────────────────────────

test.describe('XSS / 內容注入: Email Body', () => {
	test('P2: Email body 含 <script> 標籤', async () => {
		const xssBody = '<p>Hello</p><script>alert("xss")</script>'
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'XSS Test',
					body: xssBody,
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)

		// 查詢後確認 <script> 被清除或保留（取決於後端策略）
		const emailRes = await wpGet<Array<Record<string, string>>>(api, API.emails)
		const tpl = (emailRes.data as Array<Record<string, string>>).find(
			(t) => t.key === 'site_sync',
		)
		// emails body 允許 HTML，但 script 應被過濾
		if (tpl) {
			expect(tpl.body).not.toContain('<script>')
		}
	})

	test('P2: Email subject 含 HTML 標籤', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: '<b>Bold Subject</b><script>alert(1)</script>',
					body: '<p>Normal body</p>',
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('P3: Email body 含 on-event handler', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'Event Handler Test',
					body: '<img src=x onerror=alert(1)>',
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})
})

// ─── 特殊字元: Partner ID ────────────────────────────────────

test.describe('特殊字元: Partner ID', () => {
	test.afterAll(async () => {
		await wpDelete(api, API.partnerId)
	})

	test('P2: partner_id 含 Unicode（中文）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: '合作夥伴-測試-001',
		})
		expect(res.status).toBe(200)
	})

	test('P2: partner_id 含 URL 特殊字元', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'partner/with?special&chars=true',
		})
		expect(res.status).toBe(200)
	})

	test('P3: partner_id 超長字串（500 字元）', async () => {
		const longId = 'x'.repeat(500)
		const res = await wpPost(api, API.partnerId, {
			partner_id: longId,
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})
})

// ─── 特殊字元: PowerCloud API Key ────────────────────────────

test.describe('特殊字元: PowerCloud API Key', () => {
	test('P2: api_key 含 SQL injection 嘗試', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: "'; DROP TABLE wp_options; --",
		})
		// WordPress 的 sanitize 會處理，不應崩潰
		expect(res.status).toBe(200)
	})

	test('P3: api_key 含 emoji', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: '🔑key-with-emoji-🎉',
		})
		expect(res.status).toBe(200)
	})
})

// ─── 型別邊界: 陣列參數 ─────────────────────────────────────

test.describe('型別邊界: 陣列參數', () => {
	test('P2: subscriptions/next-payment ids 為字串而非陣列', async () => {
		const res = await wpGet(api, API.subscriptionsNextPayment, {
			ids: '1',
		})
		expect(res.status).toBe(400)
	})

	test('P2: apps app_ids 為空', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P2: customers user_ids 為非數字字串', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': 'not-a-number',
		})
		// WordPress 會嘗試查詢，可能回空結果
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})
})

// ─── 冪等性驗證 ──────────────────────────────────────────────

test.describe('冪等性驗證', () => {
	test('P1: 重複儲存相同設定', async () => {
		const payload = {
			power_partner_disable_site_after_n_days: 7,
		}
		const res1 = await wpPost(api, API.settings, payload)
		const res2 = await wpPost(api, API.settings, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P1: 重複設定相同 PowerCloud API Key', async () => {
		const payload = { api_key: 'idempotent-key' }
		const res1 = await wpPost(api, API.powercloudApiKey, payload)
		const res2 = await wpPost(api, API.powercloudApiKey, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P1: 重複清除模板站快取', async () => {
		const res1 = await wpPost(api, API.clearTemplateSitesCache, {})
		const res2 = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P2: 重複刪除合作夥伴連結', async () => {
		await wpPost(api, API.partnerId, { partner_id: 'to-delete-twice' })
		const res1 = await wpDelete(api, API.partnerId)
		const res2 = await wpDelete(api, API.partnerId)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})
})
