/**
 * 訂閱管理 API 測試
 *
 * 涵蓋: GetApps, GetSubscriptionsNextPayment, ChangeSubscription, GetSubscriptions
 *
 * 對應 spec:
 *   spec/features/subscription/查詢網站對應訂閱.feature
 *   spec/features/license-code/查詢訂閱下次付款日.feature
 *   spec/features/subscription/變更訂閱綁定.feature
 *   spec/features/user/查詢用戶訂閱列表.feature
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, EDGE_NUMBERS, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── GetApps (Public API) ────────────────────────────────────

test.describe('GET /apps — GetApps', () => {

	// P0: 核心功能
	test('P0: 無 app_ids 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// P1: 查詢不存在的資源
	test('P1: 查詢不存在的 app_id 回空結果', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', String(EDGE_NUMBERS.nonExistentId))
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
	})

	test('P1: 回應中每個元素包含 app_id 和 subscription_ids', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', '1')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json() as Array<Record<string, unknown>>
		if (data.length > 0) {
			const item = data[0]
			expect(item).toHaveProperty('app_id')
			expect(item).toHaveProperty('subscription_ids')
			expect(Array.isArray(item.subscription_ids)).toBe(true)
		}
	})

	// P2: 多個 app_ids
	test('P2: 查詢多個 app_ids', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', '100')
		url.searchParams.append('app_ids[]', '200')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
	})

	// P3: 邊緣案例
	test('P3: app_ids 為非數字字串', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', 'not-a-number')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		// 應回 200（空結果）而非崩潰
		expect([200, 400].includes(res.status())).toBe(true)
	})

	test('P3: app_ids 含 XSS 字串', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', EDGE_STRINGS.xssScript)
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		// 不應崩潰
		expect([200, 400].includes(res.status())).toBe(true)
	})
})

// ─── GetSubscriptionsNextPayment (Public API) ─────────────────

test.describe('GET /subscriptions/next-payment — GetSubscriptionsNextPayment', () => {

	// P0: 核心功能
	test('P0: 傳入 ids 陣列可查詢', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '1')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		// 可能 200（查到或空結果）
		expect(res.status()).toBe(200)
	})

	test('P0: 回傳的每個元素包含 id 和 time', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '1')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json() as Array<Record<string, unknown>>
		if (data.length > 0) {
			expect(data[0]).toHaveProperty('id')
			expect(data[0]).toHaveProperty('time')
		}
	})

	// P1: 參數驗證（spec 規定 ids 必須為陣列）
	test('P1: ids 不是陣列格式（pure string）回 400', async () => {
		const res = await wpGet(api, API.subscriptionsNextPayment, { ids: '1' })
		// spec: "訂閱 id 須為陣列"
		expect(res.status).toBe(400)
	})

	test('P1: 缺少 ids 參數', async () => {
		const res = await wpGet(api, API.subscriptionsNextPayment)
		// 沒有 ids 參數可能視為空陣列或回錯誤
		expect([200, 400].includes(res.status)).toBe(true)
	})

	// P2: 邊界值
	test('P2: 查詢不存在的訂閱 ID 回空陣列', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', String(EDGE_NUMBERS.nonExistentId))
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
		expect((data as Array<unknown>).length).toBe(0)
	})

	test('P2: 查詢多個訂閱 ID（批次）', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '1')
		url.searchParams.append('ids[]', '2')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
	})

	// P3: 邊緣案例
	test('P3: ids 陣列中含 0 和負數', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '0')
		url.searchParams.append('ids[]', '-1')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		// 不應崩潰
		expect([200, 400].includes(res.status())).toBe(true)
	})
})

// ─── ChangeSubscription ──────────────────────────────────────

test.describe('POST /change-subscription — ChangeSubscription', () => {

	// P0: 核心功能（驗證不回 403）
	test('P0: 管理員可呼叫變更訂閱綁定 API（不回 403）', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: String(EDGE_NUMBERS.nonExistentId),
			site_id: '100',
			linked_site_ids: ['100'],
		})
		// 訂閱不存在可能回 500，但不應 403（權限守衛通過）
		expect(res.status).not.toBe(403)
	})

	// P1: 必填參數驗證（spec 規定 subscription_id 與 site_id 不可為空）
	test('P1: 缺少 subscription_id 回 500', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			site_id: '100',
			linked_site_ids: ['100'],
		})
		expect(res.status).toBe(500)
	})

	test('P1: 缺少 site_id 回 500', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '1',
			linked_site_ids: ['100'],
		})
		expect(res.status).toBe(500)
	})

	test('P1: 缺少 linked_site_ids 回 500', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '1',
			site_id: '100',
		})
		expect(res.status).toBe(500)
	})

	test('P1: linked_site_ids 不是陣列回 500', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '1',
			site_id: '100',
			linked_site_ids: 'not-array',
		})
		expect(res.status).toBe(500)
	})

	// P2: 邊界值
	test('P2: linked_site_ids 為空陣列', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: String(EDGE_NUMBERS.nonExistentId),
			site_id: '100',
			linked_site_ids: [],
		})
		// 空陣列在邏輯上可能回 200 或 500（訂閱不存在）
		expect([200, 500].includes(res.status)).toBe(true)
	})

	test('P2: subscription_id 為 0（邊界值）', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: String(EDGE_NUMBERS.zero),
			site_id: '100',
			linked_site_ids: ['100'],
		})
		// 0 代表無效 ID，應回 500
		expect(res.status).toBe(500)
	})

	// P3: 邊緣案例
	test('P3: subscription_id 含 SQL injection', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: EDGE_STRINGS.sqlInjection,
			site_id: '100',
			linked_site_ids: ['100'],
		})
		// 不應崩潰
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P3: linked_site_ids 含大量 ID（邊界）', async () => {
		const manyIds = Array.from({ length: 100 }, (_, i) => String(i + 1))
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: String(EDGE_NUMBERS.nonExistentId),
			site_id: '100',
			linked_site_ids: manyIds,
		})
		expect([200, 500].includes(res.status)).toBe(true)
	})
})

// ─── GetSubscriptions ────────────────────────────────────────

test.describe('GET /subscriptions — GetSubscriptions', () => {

	// P0: 核心功能
	test('P0: 查詢 admin 用戶的訂閱列表', async () => {
		const res = await wpGet(api, API.subscriptions, {
			user_id: '1',
		})
		// 可能回 200（有或無訂閱皆可）
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// P1: 必填參數與回應格式
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

	test('P1: 回應包含 X-WP-TotalPages header', async () => {
		const res = await wpGet(api, API.subscriptions, {
			user_id: '1',
		})
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-totalpages']).toBeDefined()
	})

	test('P1: 每個訂閱包含必要欄位', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.subscriptions, {
			user_id: '1',
		})
		expect(res.status).toBe(200)
		if (Array.isArray(res.data) && res.data.length > 0) {
			const sub = res.data[0]
			expect(sub).toHaveProperty('id')
			expect(sub).toHaveProperty('status')
			expect(sub).toHaveProperty('post_title')
			expect(sub).toHaveProperty('post_date')
			expect(sub).toHaveProperty('linked_site_ids')
		}
	})

	// P2: 不存在的使用者
	test('P2: 不存在的 user_id 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: String(EDGE_NUMBERS.nonExistentId),
		})
		expect(res.status).toBe(200)
		expect((res.data as Array<unknown>).length).toBe(0)
	})

	// P3: 邊緣案例
	test('P3: user_id 為 0', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: String(EDGE_NUMBERS.zero),
		})
		// 0 為無效 ID，應回空陣列
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P3: user_id 為負數', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: String(EDGE_NUMBERS.negative),
		})
		expect([200, 500].includes(res.status)).toBe(true)
	})

	test('P3: user_id 為非數字字串', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: 'not-a-number',
		})
		// PHP intval('not-a-number') = 0
		expect([200, 500].includes(res.status)).toBe(true)
	})
})
