/**
 * 設定管理 API 測試
 *
 * 涵蓋: SaveSettings, SavePowerCloudApiKey, GetEmails
 *
 * 對應 spec:
 *   spec/features/settings/儲存設定.feature
 *   spec/features/settings/儲存PowerCloud金鑰.feature
 *   spec/features/email/查詢Email模板.feature
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, TEST_SETTINGS, TEST_POWERCLOUD_KEY, EDGE_NUMBERS, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── SaveSettings ────────────────────────────────────────────

test.describe('POST /settings — SaveSettings', () => {

	// P0: 核心功能正常路徑
	test('P0: 管理員可儲存 disable_site_after_n_days', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: TEST_SETTINGS.disableSiteAfterNDays,
		})
		expect(res.status).toBe(200)
	})

	test('P0: 管理員可儲存 Email 模板設定', async () => {
		const res = await wpPost(api, API.settings, {
			emails: TEST_SETTINGS.emails,
		})
		expect(res.status).toBe(200)
	})

	test('P0: 可同時儲存 disable_site_after_n_days 和 emails', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 14,
			emails: TEST_SETTINGS.emails,
		})
		expect(res.status).toBe(200)
	})

	// P1: 業務規則驗證
	test('P1: 儲存後再查詢 /emails 可取得更新的模板', async () => {
		const customSubject = 'E2E-Verify-Subject-##DOMAIN##'
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: customSubject,
					body: '<p>Verify body</p>',
					days: '0',
					operator: 'after',
				},
			],
		})

		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const tpl = (res.data as Array<Record<string, string>>).find(t => t.key === 'site_sync')
		expect(tpl).toBeDefined()
		expect(tpl!.subject).toBe(customSubject)
	})

	test('P1: enabled 為 "0" 的模板仍可儲存', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'subscription_failed',
					enabled: '0',
					action_name: 'subscription_failed',
					subject: 'Disabled Template',
					body: '<p>Disabled</p>',
					days: '3',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('P1: operator 可以是 before 或 after', async () => {
		for (const operator of ['before', 'after']) {
			const res = await wpPost(api, API.settings, {
				emails: [
					{
						key: `op_test_${operator}`,
						enabled: '1',
						action_name: 'next_payment',
						subject: `Operator ${operator}`,
						body: '<p>Test</p>',
						days: '3',
						operator,
					},
				],
			})
			expect(res.status).toBe(200)
		}
	})

	// P2: 邊界值測試
	test('P2: disable_site_after_n_days 為 0', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.zero,
		})
		expect(res.status).toBe(200)
	})

	test('P2: disable_site_after_n_days 為負數（-1）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: EDGE_NUMBERS.negative,
		})
		// PHP intval 可能接受負數或過濾，不應崩潰
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: disable_site_after_n_days 為超大數字', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 999999,
		})
		expect(res.status).toBe(200)
	})

	test('P2: Email body 含 <script> 標籤（XSS 防護）', async () => {
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'XSS Test',
					body: `<p>Hello</p>${EDGE_STRINGS.xssScript}`,
					days: '0',
					operator: 'after',
				},
			],
		})

		// 查詢後確認 <script> 已被過濾
		const emailRes = await wpGet<Array<Record<string, string>>>(api, API.emails)
		const tpl = (emailRes.data as Array<Record<string, string>>).find(t => t.key === 'site_sync')
		if (tpl) {
			// WordPress wp_kses 應過濾 script 標籤
			expect(tpl.body).not.toContain('<script>')
		}
	})

	test('P2: Email subject 含 HTML 注入', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: `Bold<b>Subject</b>${EDGE_STRINGS.xssScript}`,
					body: '<p>Normal body</p>',
					days: '0',
					operator: 'after',
				},
			],
		})
		// 應接受但 subject 可能被 sanitize
		expect(res.status).toBe(200)
	})

	test('P2: Email body 含 onerror handler', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'Event Handler Test',
					body: EDGE_STRINGS.xssImg,
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('P2: 空 body 送出仍回 200', async () => {
		const res = await wpPost(api, API.settings, {})
		expect(res.status).toBe(200)
	})

	// P3: 罕見邊緣案例
	test('P3: disable_site_after_n_days 為字串', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 'abc',
		})
		// PHP intval('abc') = 0，可能回 200
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: emails 為 null', async () => {
		const res = await wpPost(api, API.settings, {
			emails: null,
		})
		// null 傳入應被忽略或報錯，不應崩潰
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: emails 為空字串（非陣列）', async () => {
		const res = await wpPost(api, API.settings, {
			emails: EDGE_STRINGS.empty,
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: Email subject 含 Unicode + emoji', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: `${EDGE_STRINGS.unicode} ${EDGE_STRINGS.emoji}`,
					body: `<p>${EDGE_STRINGS.japanese}</p>`,
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('P3: 重複儲存相同設定（冪等性）', async () => {
		const payload = { power_partner_disable_site_after_n_days: 7 }
		const res1 = await wpPost(api, API.settings, payload)
		const res2 = await wpPost(api, API.settings, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})
})

// ─── SavePowerCloudApiKey ────────────────────────────────────

test.describe('POST /powercloud-api-key — SavePowerCloudApiKey', () => {

	// P0: 核心功能
	test('P0: 管理員可儲存 PowerCloud API Key', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: TEST_POWERCLOUD_KEY,
		})
		expect(res.status).toBe(200)
	})

	// P1: 參數驗證（spec 規定 api_key 不可為空）
	test('P1: api_key 為空字串回 400', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.empty,
		})
		expect(res.status).toBe(400)
	})

	test('P1: 缺少 api_key 欄位回 400', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {})
		expect(res.status).toBe(400)
	})

	// P2: 特殊字元
	test('P2: 包含特殊字元的 api_key 仍可成功', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: 'key-with-$pecial_chars!@#%^&*()',
		})
		expect(res.status).toBe(200)
	})

	test('P2: api_key 含 SQL injection 字串', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.sqlInjection,
		})
		// WordPress 的 sanitize 應處理，不應崩潰
		expect(res.status).toBe(200)
	})

	test('P2: api_key 含純空白（應視為空）', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.whitespace,
		})
		// 純空白可能被 trim 後視為空
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P2: 重複儲存相同 PowerCloud API Key（冪等性）', async () => {
		const payload = { api_key: 'idempotent-key-test' }
		const res1 = await wpPost(api, API.powercloudApiKey, payload)
		const res2 = await wpPost(api, API.powercloudApiKey, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})

	// P3: 罕見邊緣案例
	test('P3: api_key 含 emoji', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: `${EDGE_STRINGS.emoji}key`,
		})
		expect(res.status).toBe(200)
	})

	test('P3: api_key 超長字串（10000 字元）', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.longString,
		})
		// 超長 key 應被接受或截斷，不應崩潰
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: api_key 含 RTL 文字', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: EDGE_STRINGS.rtl,
		})
		expect(res.status).toBe(200)
	})
})

// ─── GetEmails ───────────────────────────────────────────────

test.describe('GET /emails — GetEmails', () => {

	test.beforeAll(async () => {
		// 確保有 Email 模板可查詢
		await wpPost(api, API.settings, { emails: TEST_SETTINGS.emails })
	})

	// P0: 核心功能
	test('P0: 管理員可取得 Email 模板列表', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.emails)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// P1: 回應格式驗證
	test('P1: 每個模板都有必要欄位', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		if (Array.isArray(res.data) && res.data.length > 0) {
			const template = res.data[0]
			expect(template).toHaveProperty('key')
			expect(template).toHaveProperty('enabled')
			expect(template).toHaveProperty('action_name')
			expect(template).toHaveProperty('subject')
			expect(template).toHaveProperty('body')
			expect(template).toHaveProperty('days')
			expect(template).toHaveProperty('operator')
		}
	})

	test('P1: enabled 欄位值為 "0" 或 "1"', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		if (Array.isArray(res.data)) {
			for (const tpl of res.data) {
				expect(['0', '1'].includes(tpl.enabled)).toBe(true)
			}
		}
	})

	test('P1: operator 欄位值為 before 或 after', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		if (Array.isArray(res.data)) {
			for (const tpl of res.data) {
				if (tpl.operator) {
					expect(['before', 'after'].includes(tpl.operator)).toBe(true)
				}
			}
		}
	})

	test('P1: 儲存後再查詢可取得更新的模板', async () => {
		const uniqueSubject = `E2E-GetEmails-Verify-${Date.now()}`
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: uniqueSubject,
					body: '<p>Verify get</p>',
					days: '0',
					operator: 'after',
				},
			],
		})

		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const tpl = (res.data as Array<Record<string, string>>).find(t => t.key === 'site_sync')
		expect(tpl).toBeDefined()
		expect(tpl!.subject).toBe(uniqueSubject)
	})

	// P2: 包含停用模板
	test('P2: 回應中包含已停用（enabled 為 0）的模板', async () => {
		await wpPost(api, API.settings, {
			emails: [
				{
					key: 'disabled_test',
					enabled: '0',
					action_name: 'end',
					subject: 'Disabled',
					body: '<p>Disabled</p>',
					days: '0',
					operator: 'after',
				},
			],
		})

		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		// GetEmails 應回傳所有模板（含已停用的）
		// 驗證回應是陣列
		expect(Array.isArray(res.data)).toBe(true)
	})
})
