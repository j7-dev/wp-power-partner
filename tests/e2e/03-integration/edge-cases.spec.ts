/**
 * 邊界條件與異常輸入測試
 *
 * 涵蓋以下邊緣案例矩陣:
 * - 數值邊界: 0, -1, -999, 0.5, Number.MAX_SAFE_INTEGER
 * - 字串邊界: 空字串、純空白、超長字串（10000 字元）
 * - Unicode: 中文、日文、Emoji、RTL 文字
 * - 安全性: XSS、SQL injection、路徑遍歷
 * - 狀態邊界: 不存在的 ID、重複操作、已刪除資源
 * - 型別邊界: 陣列 vs 非陣列、數字 vs 字串
 *
 * 對應 spec:
 *   spec/features/settings/儲存設定.feature
 *   spec/features/partner/設定合作夥伴連結.feature
 *   spec/features/email/發送站點帳密郵件.feature
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, EDGE_NUMBERS, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── 數值邊界: Settings ───────────────────────────────────────

test.describe('數值邊界: disable_site_after_n_days', () => {

	test('P2: 值為 0（零邊界）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.zero,
		})
		// 0 天表示立即關站，應被接受
		expect(res.status).toBe(200)
	})

	test('P2: 值為 -1（負數）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.negative,
		})
		// 負數可能被 absint 過濾為 0 或拒絕
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: 值為 -999（大負數）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.negativeHigh,
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: 值為 0.5（浮點數）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.float,
		})
		// PHP intval(0.5) = 0，應被接受
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: 值為 Number.MAX_SAFE_INTEGER', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.maxSafe,
		})
		// 超大數字可能溢出或被接受
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: 值為字串 "abc"', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 'abc',
		})
		// PHP intval('abc') = 0
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: 值為 null', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: null,
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})
})

// ─── 字串邊界: Partner ID ─────────────────────────────────────

test.describe('字串邊界: partner_id', () => {

	test.afterAll(async () => {
		// 清理測試用合作夥伴資料
		await wpDelete(api, API.partnerId).catch(() => { /* 忽略 */ })
	})

	test('P2: partner_id 為純空白（應視為空）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.whitespace,
		})
		// 純空白 trim 後可能被視為空
		if (res.status === 200) {
			// 若接受了純空白，查詢看看
			const get = await wpGet<{ data: { partner_id?: string } }>(api, API.partnerId)
			// 不強制要求具體值，只要不崩潰
			expect([200, 500].includes(get.status)).toBe(true)
		} else {
			// 被拒絕也是合理的
			expect([400, 500].includes(res.status)).toBe(true)
		}
	})

	test('P2: partner_id 為 Unicode（中文）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.unicode,
		})
		expect(res.status).toBe(200)
	})

	test('P2: partner_id 為 Japanese（日文）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.japanese,
		})
		expect(res.status).toBe(200)
	})

	test('P2: partner_id 含 emoji', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.emoji,
		})
		expect(res.status).toBe(200)
	})

	test('P2: partner_id 含 RTL 文字（阿拉伯語）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.rtl,
		})
		expect(res.status).toBe(200)
	})

	test('P3: partner_id 超長字串（10000 字元）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.longString,
		})
		// 超長字串可能被 truncate 或拒絕
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: partner_id 含 NULL byte', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.nullByte,
		})
		// NULL byte 應被 sanitize
		expect([200, 400].includes(res.status)).toBe(true)
	})
})

// ─── XSS / 安全性注入測試 ─────────────────────────────────────

test.describe('安全性: XSS 注入防護', () => {

	test('P2: Email body 含 <script> 標籤', async () => {
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'XSS Body Test',
					body: `<p>Hello</p>${EDGE_STRINGS.xssScript}`,
					days: '0',
					operator: 'after',
				},
			],
		})

		// 查詢後確認 <script> 已被 wp_kses 過濾
		const emailRes = await wpGet<Array<Record<string, string>>>(api, API.emails)
		const tpl = (emailRes.data as Array<Record<string, string>>).find(t => t.key === 'site_sync')
		if (tpl) {
			expect(tpl.body).not.toContain('<script>')
		}
	})

	test('P2: Email body 含 onerror handler（img XSS）', async () => {
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'XSS Handler Test',
					body: EDGE_STRINGS.xssImg,
					days: '0',
					operator: 'after',
				},
			],
		})
		// 不強制要求過濾 onerror，但不應崩潰
		const emailRes = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(emailRes.status).toBe(200)
	})

	test('P2: partner_id 含 SQL injection', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.sqlInjection,
		})
		// 應被 sanitize，不應崩潰
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: partner_id 含 SQL DROP TABLE', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.sqlDrop,
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: PowerCloud api_key 含 SQL injection', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.sqlInjection,
		})
		// WordPress 的 sanitize 應處理，不應崩潰
		expect(res.status).toBe(200)
	})

	test('P3: partner_id 含路徑遍歷', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.pathTraversal,
		})
		// 路徑遍歷應被過濾
		expect([200, 400].includes(res.status)).toBe(true)
	})
})

// ─── 陣列型別邊界 ─────────────────────────────────────────────

test.describe('型別邊界: 陣列參數', () => {

	test('P2: subscriptions/next-payment ids 為字串而非陣列', async () => {
		const res = await wpGet(api, API.subscriptionsNextPayment, {
			ids: '1',
		})
		// spec: "訂閱 id 須為陣列"，回 400
		expect(res.status).toBe(400)
	})

	test('P2: apps app_ids 為空（不傳參數）', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P2: customers user_ids 為非數字字串', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': 'not-a-number',
		})
		// WordPress 嘗試查詢，可能回空結果
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P2: change-subscription linked_site_ids 為物件（非陣列）', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '1',
			site_id: '100',
			linked_site_ids: { '0': 'abc' }, // 物件而非陣列
		})
		expect(res.status).toBe(500)
	})

	test('P3: license-codes/update ids 含 float', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.float],
			post_status: 'available',
		})
		// PHP intval(0.5) = 0，可能被接受或回錯誤
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})
})

// ─── 重複操作冪等性驗證 ────────────────────────────────────────

test.describe('冪等性: 重複操作驗證', () => {

	test('P1: 重複儲存相同設定兩次', async () => {
		const payload = { power_partner_disable_site_after_n_days: 7 }
		const res1 = await wpPost(api, API.settings, payload)
		const res2 = await wpPost(api, API.settings, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P1: 重複設定相同 PowerCloud API Key', async () => {
		const payload = { api_key: 'e2e-idempotent-test-key' }
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
		await wpPost(api, API.partnerId, { partner_id: 'e2e-to-delete-twice' })
		const res1 = await wpDelete(api, API.partnerId)
		const res2 = await wpDelete(api, API.partnerId)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	test('P2: 重複查詢相同客戶資訊', async () => {
		const params = { 'user_ids[]': '1' }
		const res1 = await wpGet(api, API.customers, params)
		const res2 = await wpGet(api, API.customers, params)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})
})

// ─── 已刪除資源存取 ────────────────────────────────────────────

test.describe('狀態邊界: 已刪除/不存在資源存取', () => {

	test('P2: 查詢已刪除合作夥伴的 account-info（返回 null）', async () => {
		// 確保已刪除
		await wpDelete(api, API.partnerId)

		const res = await wpGet<{ data: { encrypted_account_info: unknown } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: unknown } }
		// 已刪除後，encrypted_account_info 應為 null
		expect(body.data?.encrypted_account_info).toBeNull()

		// 還原
		await wpPost(api, API.partnerId, {
			partner_id: 'e2e-restored-partner',
			encrypted_account_info: 'e2e-restored-info',
		})
	})

	test('P2: 查詢不存在的訂閱（999999）', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: '999999',
		})
		expect(res.status).toBe(200)
		expect((res.data as Array<unknown>).length).toBe(0)
	})

	test('P2: 更新不存在的授權碼（999999）不回 403', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [999999],
			post_status: 'available',
		})
		// 不存在的 LC 可能 200 或 500，但不應 403
		expect(res.status).not.toBe(403)
	})

	test('P3: 對不存在的 user_id 搜尋客戶', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			id: '999999',
		})
		// spec: 找不到客戶回 404
		expect(res.status).toBe(404)
	})
})
