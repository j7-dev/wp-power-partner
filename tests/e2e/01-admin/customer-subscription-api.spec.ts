/**
 * 客戶與訂閱查詢 API 測試
 *
 * 涵蓋: GetCustomersBySearch, GetCustomers, GetSubscriptions
 */
import { test, expect } from '@playwright/test'
import { wpGet, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── GetCustomersBySearch ────────────────────────────────────

test.describe('GET /customers-by-search — GetCustomersBySearch', () => {
	test('P0: 以 admin ID 搜尋可取得結果', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.customersBySearch, {
			id: '1',
		})
		expect(res.status).toBe(200)
		const body = res.data as { data?: Array<{ id: string; display_name: string }> }
		expect(body.data).toBeDefined()
		expect(Array.isArray(body.data)).toBe(true)
	})

	test('P0: 以關鍵字搜尋', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.customersBySearch, {
			search: 'admin',
		})
		expect(res.status).toBe(200)
	})

	test('P1: 缺少 id 和 search 回 400', async () => {
		const res = await wpGet(api, API.customersBySearch)
		expect(res.status).toBe(400)
	})

	test('P2: 搜尋不存在的用戶回 404', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: 'nonexistent_user_e2e_zzz',
		})
		expect(res.status).toBe(404)
	})

	test('P2: 搜尋不存在的 ID 回 404', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			id: '999999',
		})
		expect(res.status).toBe(404)
	})

	test('P3: 搜尋空字串仍需回 400 或結果', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: '',
		})
		expect([200, 400].includes(res.status)).toBe(true)
	})
})

// ─── GetCustomers ────────────────────────────────────────────

test.describe('GET /customers — GetCustomers', () => {
	test('P0: 以 user_ids 取得客戶資訊', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 回應包含 X-WP-Total header', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-total']).toBeDefined()
	})

	test('P1: 客戶資料包含必要欄位', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		if (Array.isArray(res.data) && res.data.length > 0) {
			const user = res.data[0]
			expect(user).toHaveProperty('id')
			expect(user).toHaveProperty('user_login')
			expect(user).toHaveProperty('user_email')
			expect(user).toHaveProperty('display_name')
		}
	})

	test('P2: 缺少 user_ids 參數回 500', async () => {
		const res = await wpGet(api, API.customers)
		expect(res.status).toBe(500)
	})

	test('P2: 不存在的 user_id 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.customers, {
			'user_ids[]': '999999',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
		expect((res.data as Array<unknown>).length).toBe(0)
	})
})

// ─── GetSubscriptions ────────────────────────────────────────

test.describe('GET /subscriptions — GetSubscriptions', () => {
	test('P0: 查詢 admin 用戶的訂閱列表', async () => {
		const res = await wpGet(api, API.subscriptions, {
			user_id: '1',
		})
		// 可能回 200（有/無訂閱皆可）
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 缺少 user_id 回 500', async () => {
		const res = await wpGet(api, API.subscriptions)
		expect(res.status).toBe(500)
	})

	test('P1: 回應包含 X-WP-Total header', async () => {
		const res = await wpGet(api, API.subscriptions, {
			user_id: '1',
		})
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-total']).toBeDefined()
	})

	test('P2: 不存在的 user_id 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: '999999',
		})
		expect(res.status).toBe(200)
		expect((res.data as Array<unknown>).length).toBe(0)
	})
})
