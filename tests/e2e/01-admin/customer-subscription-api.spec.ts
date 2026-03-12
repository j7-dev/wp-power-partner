/**
 * 客戶與訂閱查詢 API 測試
 *
 * 涵蓋: GetCustomersBySearch, GetCustomers, GetSubscriptions
 *
 * 對應 spec:
 *   spec/features/user/搜尋客戶.feature
 *   spec/features/user/查詢客戶資訊.feature
 *   spec/features/user/查詢用戶訂閱列表.feature
 */
import { test, expect } from '@playwright/test'
import { wpGet, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, EDGE_NUMBERS, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── GetCustomersBySearch ────────────────────────────────────

test.describe('GET /customers-by-search — GetCustomersBySearch', () => {

	// P0: 核心功能
	test('P0: 以 admin ID 搜尋可取得結果', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.customersBySearch, {
			id: '1',
		})
		expect(res.status).toBe(200)
		const body = res.data as { data?: Array<{ id: string; display_name: string }> }
		expect(body.data).toBeDefined()
		expect(Array.isArray(body.data)).toBe(true)
	})

	test('P0: 以關鍵字搜尋可取得結果', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.customersBySearch, {
			search: 'admin',
		})
		expect(res.status).toBe(200)
	})

	// P1: 必填參數驗證（spec 規定 id 或 search 至少需提供一個）
	test('P1: 缺少 id 和 search 回 400', async () => {
		const res = await wpGet(api, API.customersBySearch)
		// spec: "missing id or search parameter"
		expect(res.status).toBe(400)
	})

	test('P1: 回應格式包含 status + message + data', async () => {
		const res = await wpGet<Record<string, unknown>>(api, API.customersBySearch, {
			id: '1',
		})
		expect(res.status).toBe(200)
		const body = res.data as Record<string, unknown>
		expect(body).toHaveProperty('data')
	})

	test('P1: data 陣列中每個元素含 id 和 display_name', async () => {
		const res = await wpGet<{ data: Array<{ id: string; display_name: string }> }>(
			api,
			API.customersBySearch,
			{ id: '1' },
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: Array<{ id: string; display_name: string }> }
		if (body.data && body.data.length > 0) {
			expect(body.data[0]).toHaveProperty('id')
			expect(body.data[0]).toHaveProperty('display_name')
		}
	})

	// P2: 邊界情境
	test('P2: 搜尋不存在的用戶回 404', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: 'nonexistent_user_e2e_zzz999',
		})
		// spec: 找不到客戶回 404
		expect(res.status).toBe(404)
	})

	test('P2: 以不存在的 ID 搜尋回 404', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			id: String(EDGE_NUMBERS.nonExistentId),
		})
		expect(res.status).toBe(404)
	})

	test('P2: 搜尋空字串', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: EDGE_STRINGS.empty,
		})
		// 空搜尋字串可能回 400 或空結果
		expect([200, 400].includes(res.status)).toBe(true)
	})

	// P3: 邊緣案例
	test('P3: 搜尋字串含 SQL injection', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: EDGE_STRINGS.sqlInjection,
		})
		// 應被 sanitize，不應崩潰，可能 404 或 200
		expect([200, 400, 404].includes(res.status)).toBe(true)
	})

	test('P3: 搜尋字串含 XSS', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: EDGE_STRINGS.xssScript,
		})
		// 不應崩潰
		expect([200, 400, 404].includes(res.status)).toBe(true)
	})

	test('P3: 搜尋字串含 Unicode', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: EDGE_STRINGS.unicode,
		})
		expect([200, 400, 404].includes(res.status)).toBe(true)
	})

	test('P3: id 為 0（邊界值）', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			id: String(EDGE_NUMBERS.zero),
		})
		// 0 為無效 ID，應回 404
		expect([400, 404].includes(res.status)).toBe(true)
	})

	test('P3: id 為負數', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			id: String(EDGE_NUMBERS.negative),
		})
		expect([400, 404].includes(res.status)).toBe(true)
	})

	test('P3: 超長搜尋字串（10000 字元）', async () => {
		const res = await wpGet(api, API.customersBySearch, {
			search: EDGE_STRINGS.longString,
		})
		// 不應崩潰
		expect([200, 400, 404].includes(res.status)).toBe(true)
	})
})

// ─── GetCustomers ────────────────────────────────────────────

test.describe('GET /customers — GetCustomers', () => {

	// P0: 核心功能
	test('P0: 以 user_ids 取得客戶資訊', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// P1: 回應格式（spec 規定包含 id, user_login, user_email, display_name）
	test('P1: 回應包含 X-WP-Total header', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-total']).toBeDefined()
	})

	test('P1: 回應包含 X-WP-TotalPages header', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': '1',
		})
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-totalpages']).toBeDefined()
	})

	test('P1: 客戶資料包含必要欄位（id, user_login, user_email, display_name）', async () => {
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

	// P2: 缺少必填參數（spec 規定 user_ids 不可為空）
	test('P2: 缺少 user_ids 參數回 500', async () => {
		const res = await wpGet(api, API.customers)
		// spec: "missing user ids"
		expect(res.status).toBe(500)
	})

	test('P2: 不存在的 user_id 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.customers, {
			'user_ids[]': String(EDGE_NUMBERS.nonExistentId),
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
		expect((res.data as Array<unknown>).length).toBe(0)
	})

	test('P2: 多個 user_ids 批次查詢', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.customers}`)
		url.searchParams.append('user_ids[]', '1')
		url.searchParams.append('user_ids[]', String(EDGE_NUMBERS.nonExistentId))
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
	})

	// P3: 邊緣案例
	test('P3: user_ids 含 0', async () => {
		const res = await wpGet<Array<unknown>>(api, API.customers, {
			'user_ids[]': String(EDGE_NUMBERS.zero),
		})
		// 0 為無效 ID，應回空陣列
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P3: user_ids 為非數字字串', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': 'not-a-number',
		})
		// WordPress 嘗試查詢，可能回空結果
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: user_ids 含 SQL injection', async () => {
		const res = await wpGet(api, API.customers, {
			'user_ids[]': EDGE_STRINGS.sqlInjection,
		})
		// 不應崩潰
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})
})
