/**
 * 合作夥伴管理 API 測試
 *
 * 涵蓋: SetPartnerId, GetPartnerId, DeletePartnerId, GetAccountInfo
 *
 * 對應 spec:
 *   spec/features/partner/設定合作夥伴連結.feature
 *   spec/features/partner/刪除合作夥伴連結.feature
 *   spec/features/partner/查詢合作夥伴ID.feature
 *   spec/features/partner/查詢帳號資訊.feature
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, TEST_PARTNER, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── SetPartnerId ────────────────────────────────────────────

test.describe('POST /partner-id — SetPartnerId', () => {

	test.afterAll(async () => {
		// 測試後確保環境乾淨
		await wpDelete(api, API.partnerId).catch(() => { /* 忽略錯誤 */ })
	})

	// P0: 核心功能
	test('P0: 管理員可設定合作夥伴 ID（完整參數）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
			encrypted_account_info: TEST_PARTNER.encryptedAccountInfo,
			allowed_template_options: TEST_PARTNER.allowedTemplateOptions,
		})
		expect(res.status).toBe(200)
	})

	test('P0: 只傳 partner_id（最小參數）也可成功', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'e2e-minimal-partner',
		})
		expect(res.status).toBe(200)
	})

	// P1: 參數驗證（spec 規定 partner_id 不可為空）
	test('P1: partner_id 為空字串回錯誤', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.empty,
		})
		// spec: 回傳錯誤 "partner_id is empty"
		// 可能是 HTTP 400 或 data.status 100
		if (res.status === 200) {
			expect((res.data as Record<string, unknown>).status).toBe(100)
		} else {
			expect([400, 500].includes(res.status)).toBe(true)
		}
	})

	test('P1: 覆蓋設定已存在的 partner_id（更新操作）', async () => {
		await wpPost(api, API.partnerId, { partner_id: 'e2e-old-partner' })

		const res = await wpPost(api, API.partnerId, {
			partner_id: 'e2e-new-override',
		})
		expect(res.status).toBe(200)

		// 確認確實被更新
		const get = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		if (get.status === 200) {
			expect((get.data as { data: { partner_id: string } }).data?.partner_id).toBe('e2e-new-override')
		}
	})

	// P2: 特殊字元
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

	test('P2: allowed_template_options 為空物件', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'e2e-empty-templates',
			allowed_template_options: {},
		})
		expect(res.status).toBe(200)
	})

	// P3: 罕見邊緣案例
	test('P3: partner_id 超長字串（500 字元）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'x'.repeat(500),
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: partner_id 含 SQL injection', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.sqlInjection,
		})
		// 應被 sanitize，不應崩潰
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: partner_id 含 XSS', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: EDGE_STRINGS.xssScript,
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})

	test('P3: 重複設定相同 partner_id（冪等性）', async () => {
		const payload = { partner_id: 'e2e-idempotent-partner' }
		const res1 = await wpPost(api, API.partnerId, payload)
		const res2 = await wpPost(api, API.partnerId, payload)
		expect(res1.status).toBe(200)
		expect(res2.status).toBe(200)
	})
})

// ─── GetPartnerId ────────────────────────────────────────────

test.describe('GET /partner-id — GetPartnerId', () => {

	test.beforeAll(async () => {
		// 確保有設定 partner_id
		await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
		})
	})

	// P0: 核心功能
	test('P0: 可取得合作夥伴 ID', async () => {
		const res = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(res.status).toBe(200)
		const body = res.data as { data: { partner_id: string } }
		expect(body.data?.partner_id).toBeTruthy()
	})

	// P1: 回應格式
	test('P1: 回應格式包含 status + message + data 結構', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.partnerId)
		expect(res.status).toBe(200)
		const body = res.data as Record<string, unknown>
		expect(body).toHaveProperty('data')
		const data = body.data as Record<string, unknown>
		expect(data).toHaveProperty('partner_id')
	})

	test('P1: 設定後查詢到的 partner_id 與設定值一致', async () => {
		const res = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(res.status).toBe(200)
		expect((res.data as { data: { partner_id: string } }).data?.partner_id).toBe(TEST_PARTNER.partnerId)
	})

	// P2: 未設定時的狀態
	test('P2: 刪除後再查詢回 500 或 partner_id 為空', async () => {
		await wpDelete(api, API.partnerId)
		const res = await wpGet(api, API.partnerId)
		// spec: "fail, partner_id is empty"
		if (res.status === 200) {
			const body = res.data as { data?: { partner_id?: string } }
			expect(!body.data?.partner_id || body.data.partner_id === '').toBe(true)
		} else {
			expect([500].includes(res.status)).toBe(true)
		}

		// 清理後還原
		await wpPost(api, API.partnerId, { partner_id: TEST_PARTNER.partnerId })
	})
})

// ─── DeletePartnerId ─────────────────────────────────────────

test.describe('DELETE /partner-id — DeletePartnerId', () => {

	test.beforeEach(async () => {
		// 每次測試前先確保有合作夥伴設定存在
		await wpPost(api, API.partnerId, {
			partner_id: 'e2e-to-be-deleted',
			encrypted_account_info: 'enc-info-to-delete',
		})
	})

	// P0: 核心功能
	test('P0: 管理員可刪除合作夥伴連結', async () => {
		const res = await wpDelete(api, API.partnerId)
		expect(res.status).toBe(200)
	})

	// P1: 刪除後狀態驗證
	test('P1: 刪除後查詢 partner_id 為空', async () => {
		await wpDelete(api, API.partnerId)
		const res = await wpGet(api, API.partnerId)
		if (res.status === 200) {
			const body = res.data as { data?: { partner_id?: string } }
			expect(!body.data?.partner_id || body.data.partner_id === '').toBe(true)
		} else {
			expect(res.status).toBe(500)
		}
	})

	test('P1: 刪除後查詢 account_info 為空或 null', async () => {
		await wpDelete(api, API.partnerId)
		const res = await wpGet<{ data: { encrypted_account_info?: string | null } }>(api, API.accountInfo)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: string | null } }
		// spec: 刪除後 encrypted_account_info 應為 null 或空
		expect(
			body.data?.encrypted_account_info == null || body.data?.encrypted_account_info === ''
		).toBe(true)
	})

	// P2: 冪等性
	test('P2: 重複刪除仍回 200（冪等）', async () => {
		await wpDelete(api, API.partnerId)
		const res = await wpDelete(api, API.partnerId)
		expect(res.status).toBe(200)
	})
})

// ─── GetAccountInfo ──────────────────────────────────────────

test.describe('GET /account-info — GetAccountInfo', () => {

	test.beforeAll(async () => {
		await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
			encrypted_account_info: TEST_PARTNER.encryptedAccountInfo,
		})
	})

	// P0: 核心功能
	test('P0: 可取得加密帳號資訊', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
	})

	// P1: 回應格式
	test('P1: 回應包含 encrypted_account_info 欄位', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.accountInfo)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: string } }
		expect(body.data).toHaveProperty('encrypted_account_info')
	})

	test('P1: 設定後查詢到的 encrypted_account_info 與設定值一致', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: { encrypted_account_info: string } }
		expect(body.data?.encrypted_account_info).toBe(TEST_PARTNER.encryptedAccountInfo)
	})

	// P2: 未設定時
	test('P2: 無設定時 encrypted_account_info 為 null', async () => {
		// 先刪除
		await wpDelete(api, API.partnerId)

		const res = await wpGet<{ data: { encrypted_account_info: string | null } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: string | null } }
		// spec: 未設定帳號資訊時回傳 null
		expect(body.data?.encrypted_account_info).toBeNull()

		// 還原
		await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
			encrypted_account_info: TEST_PARTNER.encryptedAccountInfo,
		})
	})
})
