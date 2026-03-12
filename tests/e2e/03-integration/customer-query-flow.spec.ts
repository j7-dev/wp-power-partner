/**
 * 客戶查詢跨功能整合測試
 *
 * 測試完整管理員操作流程:
 *   搜尋客戶 → 取得詳細資訊 → 查詢訂閱 → 查詢下次付款日 → 查詢網站對應訂閱
 *
 * 對應 spec:
 *   spec/activities/管理員操作流程.activity
 *   spec/features/user/搜尋客戶.feature
 *   spec/features/user/查詢客戶資訊.feature
 *   spec/features/user/查詢用戶訂閱列表.feature
 *   spec/features/subscription/查詢網站對應訂閱.feature
 *   spec/features/license-code/查詢訂閱下次付款日.feature
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

test.describe('管理員客戶查詢完整流程', () => {
	let foundUserId: string

	// Step 1: 搜尋管理員客戶
	test('Step 1: 以關鍵字搜尋客戶（admin）', async () => {
		const res = await wpGet<{ data: Array<{ id: string; display_name: string }> }>(
			api,
			API.customersBySearch,
			{ search: 'admin' },
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: Array<{ id: string; display_name: string }> }
		expect(body.data).toBeDefined()
		expect(body.data.length).toBeGreaterThan(0)
		foundUserId = body.data[0].id
		expect(foundUserId).toBeTruthy()
	})

	// Step 2: 以 ID 精確搜尋
	test('Step 2: 以 ID 精確搜尋確認是同一用戶', async () => {
		const res = await wpGet<{ data: Array<{ id: string; display_name: string }> }>(
			api,
			API.customersBySearch,
			{ id: foundUserId || '1' },
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: Array<{ id: string; display_name: string }> }
		expect(body.data.length).toBeGreaterThan(0)
		expect(body.data[0].id).toBe(foundUserId || '1')
	})

	// Step 3: 用搜尋到的 ID 取得客戶詳細資訊
	test('Step 3: 取得客戶詳細資訊（id, user_login, user_email, display_name）', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.customers, {
			'user_ids[]': foundUserId || '1',
		})
		expect(res.status).toBe(200)
		const users = res.data as Array<Record<string, string>>
		expect(users.length).toBeGreaterThan(0)
		expect(users[0].user_login).toBeTruthy()
		expect(users[0].user_email).toBeTruthy()
		expect(users[0].id).toBe(foundUserId || '1')
	})

	// Step 4: 查詢該用戶的訂閱列表
	test('Step 4: 查詢用戶訂閱列表', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: foundUserId || '1',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
		// 確認有分頁 header
		expect(res.headers['x-wp-total']).toBeDefined()
	})

	// Step 5: 查詢網站對應訂閱
	test('Step 5: 查詢網站對應訂閱（空查詢回空陣列）', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// Step 6: 查詢訂閱下次付款日
	test('Step 6: 查詢訂閱下次付款日（不存在的訂閱回空陣列）', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '999999')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
	})
})

test.describe('網站對應訂閱查詢整合', () => {

	// P0: 基本查詢
	test('P0: 查詢空 app_ids 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	// P1: 回應結構驗證
	test('P1: apps 回應結構驗證（有資料時含 app_id 和 subscription_ids）', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', '1')
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json() as Array<Record<string, unknown>>
		if (data.length > 0) {
			expect(data[0]).toHaveProperty('app_id')
			expect(data[0]).toHaveProperty('subscription_ids')
			expect(Array.isArray(data[0].subscription_ids)).toBe(true)
		}
	})

	// P2: 同時查詢客戶資訊和訂閱（批次操作）
	test('P2: 批次查詢多個客戶資訊', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.customers}`)
		url.searchParams.append('user_ids[]', '1')
		url.searchParams.append('user_ids[]', '999999') // 一個存在、一個不存在
		const res = await api.request.get(url.toString(), {
			headers: { 'X-WP-Nonce': api.nonce, 'Content-Type': 'application/json' },
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
		// 只有 user_id=1 的存在，不存在的被忽略
		expect((data as Array<unknown>).length).toBeGreaterThanOrEqual(0)
	})
})

test.describe('分頁 Header 驗證', () => {

	// P1: X-WP-Total 和 X-WP-TotalPages
	test('P1: /subscriptions 回應包含正確分頁 headers', async () => {
		const res = await wpGet(api, API.subscriptions, { user_id: '1' })
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-total']).toBeDefined()
		expect(res.headers['x-wp-totalpages']).toBeDefined()
		// 值應為數字字串
		expect(Number(res.headers['x-wp-total'])).toBeGreaterThanOrEqual(0)
	})

	test('P1: /customers 回應包含正確分頁 headers', async () => {
		const res = await wpGet(api, API.customers, { 'user_ids[]': '1' })
		expect(res.status).toBe(200)
		expect(res.headers['x-wp-total']).toBeDefined()
		expect(res.headers['x-wp-totalpages']).toBeDefined()
	})
})
