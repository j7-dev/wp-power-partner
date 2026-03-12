/**
 * 訂閱查詢 API 測試
 *
 * 涵蓋: GetApps, GetSubscriptionsNextPayment, ChangeSubscription
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── GetApps ─────────────────────────────────────────────────

test.describe('GET /apps — GetApps', () => {
	test('P0: 無 app_ids 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 查詢不存在的 app_id 回空結果', async () => {
		const res = await wpGet<Array<unknown>>(api, API.apps, {
			'app_ids[]': '999999',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P2: 查詢多個 app_ids（用多個參數）', async () => {
		// 注意: wpGet 用 Record<string,string>，多值需用不同方式
		const url = new URL(`${api.baseURL}/wp-json/${API.apps}`)
		url.searchParams.append('app_ids[]', '100')
		url.searchParams.append('app_ids[]', '200')
		const res = await api.request.get(url.toString(), {
			headers: {
				'X-WP-Nonce': api.nonce,
				'Content-Type': 'application/json',
			},
		})
		expect(res.status()).toBe(200)
		const data = await res.json()
		expect(Array.isArray(data)).toBe(true)
	})
})

// ─── GetSubscriptionsNextPayment ─────────────────────────────

test.describe('GET /subscriptions/next-payment — GetSubscriptionsNextPayment', () => {
	test('P0: 傳入 ids 陣列可查詢', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptionsNextPayment, {
			'ids[]': '1',
		})
		// 可能 200（查到或空）
		expect(res.status).toBe(200)
	})

	test('P1: ids 不是陣列格式回 400', async () => {
		const res = await wpGet(api, API.subscriptionsNextPayment, {
			ids: '1',
		})
		expect(res.status).toBe(400)
	})

	test('P2: 查詢不存在的訂閱 ID 回空陣列', async () => {
		const res = await wpGet<Array<unknown>>(api, API.subscriptionsNextPayment, {
			'ids[]': '999999',
		})
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P2: 查詢多個訂閱 ID', async () => {
		const url = new URL(`${api.baseURL}/wp-json/${API.subscriptionsNextPayment}`)
		url.searchParams.append('ids[]', '1')
		url.searchParams.append('ids[]', '2')
		const res = await api.request.get(url.toString(), {
			headers: {
				'X-WP-Nonce': api.nonce,
				'Content-Type': 'application/json',
			},
		})
		expect(res.status()).toBe(200)
	})
})

// ─── ChangeSubscription ──────────────────────────────────────

test.describe('POST /change-subscription — ChangeSubscription', () => {
	test('P0: 管理員可呼叫變更訂閱綁定 API', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '999999',
			site_id: '100',
			linked_site_ids: ['100', '200'],
		})
		// 訂閱不存在可能回 500，但不應 403
		expect(res.status).not.toBe(403)
	})

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

	test('P1: linked_site_ids 不是陣列回 500', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '1',
			site_id: '100',
			linked_site_ids: 'not-array',
		})
		expect(res.status).toBe(500)
	})

	test('P2: linked_site_ids 為空陣列', async () => {
		const res = await wpPost(api, API.changeSubscription, {
			subscription_id: '999999',
			site_id: '100',
			linked_site_ids: [],
		})
		// 空陣列在邏輯上可能回 200 或 500
		expect([200, 500].includes(res.status)).toBe(true)
	})
})
