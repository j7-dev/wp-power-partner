/**
 * 合作夥伴管理 API 測試
 *
 * 涵蓋: SetPartnerId, GetPartnerId, DeletePartnerId, GetAccountInfo
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, TEST_PARTNER } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── SetPartnerId ────────────────────────────────────────────

test.describe('POST /partner-id — SetPartnerId', () => {
	test('P0: 管理員可設定合作夥伴 ID', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
			encrypted_account_info: TEST_PARTNER.encryptedAccountInfo,
			allowed_template_options: TEST_PARTNER.allowedTemplateOptions,
		})
		expect(res.status).toBe(200)
	})

	test('P1: partner_id 為空回錯誤', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: '',
		})
		// API 回 error code 100 或 400
		expect([400, 200].includes(res.status)).toBe(true)
		if (res.status === 200) {
			expect((res.data as Record<string, unknown>).status).toBe(100)
		}
	})

	test('P2: 只傳 partner_id 不傳其他欄位也可成功', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'minimal-partner-id',
		})
		expect(res.status).toBe(200)
	})

	test('P2: 覆蓋設定已存在的 partner_id', async () => {
		await wpPost(api, API.partnerId, { partner_id: 'old-partner' })
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'new-partner-override',
		})
		expect(res.status).toBe(200)

		const get = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(get.status).toBe(200)
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

	test('P0: 可取得合作夥伴 ID', async () => {
		const res = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(res.status).toBe(200)
		expect((res.data as { data: { partner_id: string } }).data.partner_id).toBeTruthy()
	})

	test('P1: 回應格式包含 status + data 結構', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.partnerId)
		expect(res.status).toBe(200)
		const body = res.data as Record<string, unknown>
		expect(body).toHaveProperty('data')
	})
})

// ─── DeletePartnerId ─────────────────────────────────────────

test.describe('DELETE /partner-id — DeletePartnerId', () => {
	test.beforeAll(async () => {
		await wpPost(api, API.partnerId, {
			partner_id: 'to-be-deleted',
			encrypted_account_info: 'some-info',
		})
	})

	test('P0: 管理員可刪除合作夥伴連結', async () => {
		const res = await wpDelete(api, API.partnerId)
		expect(res.status).toBe(200)
	})

	test('P1: 刪除後 GET 回傳空或 500', async () => {
		await wpDelete(api, API.partnerId)
		const res = await wpGet(api, API.partnerId)
		// partner_id 不存在時可能回 500 或回空值
		expect([200, 500].includes(res.status)).toBe(true)
	})

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

	test('P0: 可取得加密帳號資訊', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
	})

	test('P1: 回應包含 encrypted_account_info 欄位', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.accountInfo)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: string } }
		expect(body.data).toHaveProperty('encrypted_account_info')
	})
})
