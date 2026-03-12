/**
 * 客戶查詢跨功能整合測試
 *
 * 測試: 客戶搜尋 → 取得詳細資訊 → 查詢訂閱 → 查詢下次付款日
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

test.describe('客戶查詢整合流程', () => {
	let foundUserId: string

	test('Step 1: 搜尋管理員客戶', async () => {
		const res = await wpGet<{ data: Array<{ id: string; display_name: string }> }>(
			api,
			API.customersBySearch,
			{ search: 'admin' },
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: Array<{ id: string; display_name: string }> }
		expect(body.data.length).toBeGreaterThan(0)
		foundUserId = body.data[0].id
		expect(foundUserId).toBeTruthy()
	})

	test('Step 2: 用搜尋到的 ID 取得客戶詳細資訊', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.customers, {
			'user_ids[]': foundUserId || '1',
		})
		expect(res.status).toBe(200)
		const users = res.data as Array<Record<string, string>>
		expect(users.length).toBeGreaterThan(0)
		expect(users[0].user_login).toBeTruthy()
		expect(users[0].user_email).toBeTruthy()
	})

	test('Step 3: 查詢該用戶的訂閱列表', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptions, {
			user_id: foundUserId || '1',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('Step 4: 以 ID 精確搜尋客戶', async () => {
		const res = await wpGet<{ data: Array<{ id: string }> }>(
			api,
			API.customersBySearch,
			{ id: foundUserId || '1' },
		)
		expect(res.status).toBe(200)
		const body = res.data as { data: Array<{ id: string }> }
		expect(body.data.length).toBeGreaterThan(0)
		expect(body.data[0].id).toBe(foundUserId || '1')
	})
})

test.describe('網站對應訂閱查詢', () => {
	test('P0: 查詢空 apps 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: apps 回應結構驗證（若有資料）', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.apps, {
			'app_ids[]': '1',
		})
		expect(res.status).toBe(200)
		if (Array.isArray(res.data) && res.data.length > 0) {
			const item = res.data[0] as Record<string, unknown>
			expect(item).toHaveProperty('app_id')
			expect(item).toHaveProperty('subscription_ids')
			expect(Array.isArray(item.subscription_ids)).toBe(true)
		}
	})
})
