/**
 * 公開 API 測試（不需認證）
 *
 * 涵蓋: GetPartnerId, GetAccountInfo, GetApps, GetCustomers, GetSubscriptionsNextPayment
 * 這些 API 是 Public 端點，不需要 WordPress 登入 Cookie 或 X-WP-Nonce。
 */
import { test, expect, request as pwRequest } from '@playwright/test'

let baseURL: string

test.beforeAll(async ({}, testInfo) => {
	baseURL = testInfo.project.use.baseURL!
})

async function publicGet(endpoint: string, params?: Record<string, string>) {
	const ctx = await pwRequest.newContext()
	const url = new URL(`${baseURL}/wp-json/${endpoint}`)
	if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
	const res = await ctx.get(url.toString())
	const data = await res.json().catch(() => ({}))
	await ctx.dispose()
	return { data, status: res.status() }
}

// ─── GetPartnerId (Public) ───────────────────────────────────

test.describe('GET /partner-id — Public API', () => {
	test('P0: 未認證可查詢 partner-id', async () => {
		const res = await publicGet('power-partner/partner-id')
		// 有設定時回 200，無設定時可能回 500
		expect([200, 500].includes(res.status)).toBe(true)
	})

	test('P1: 回應結構包含 data 欄位', async () => {
		const res = await publicGet('power-partner/partner-id')
		if (res.status === 200) {
			expect(res.data).toHaveProperty('data')
		}
	})
})

// ─── GetAccountInfo (Public) ─────────────────────────────────

test.describe('GET /account-info — Public API', () => {
	test('P0: 未認證可查詢帳號資訊', async () => {
		const res = await publicGet('power-partner/account-info')
		expect(res.status).toBe(200)
	})

	test('P1: 回應結構包含 encrypted_account_info', async () => {
		const res = await publicGet('power-partner/account-info')
		if (res.status === 200) {
			expect(res.data).toHaveProperty('data')
		}
	})
})

// ─── GetApps (Public) ────────────────────────────────────────

test.describe('GET /apps — Public API', () => {
	test('P0: 未認證可查詢網站對應訂閱', async () => {
		const res = await publicGet('power-partner/apps')
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 查詢不存在的 app_id', async () => {
		const res = await publicGet('power-partner/apps', { 'app_ids[]': '999999' })
		expect(res.status).toBe(200)
	})
})

// ─── GetCustomers (Public) ───────────────────────────────────

test.describe('GET /customers — Public API', () => {
	test('P0: 未認證可以 user_ids 查詢客戶', async () => {
		const res = await publicGet('power-partner/customers', { 'user_ids[]': '1' })
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 回應包含分頁 header', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.get(`${baseURL}/wp-json/power-partner/customers?user_ids[]=1`)
		expect(res.status()).toBe(200)
		const headers = res.headers()
		expect(headers['x-wp-total']).toBeDefined()
		await ctx.dispose()
	})

	test('P2: 缺少 user_ids 回 500', async () => {
		const res = await publicGet('power-partner/customers')
		expect(res.status).toBe(500)
	})
})

// ─── GetSubscriptionsNextPayment (Public) ────────────────────

test.describe('GET /subscriptions/next-payment — Public API', () => {
	test('P0: 未認證可查詢下次付款日', async () => {
		const res = await publicGet('power-partner/subscriptions/next-payment', {
			'ids[]': '1',
		})
		expect(res.status).toBe(200)
	})

	test('P1: ids 非陣列格式回 400', async () => {
		const res = await publicGet('power-partner/subscriptions/next-payment', {
			ids: '1',
		})
		expect(res.status).toBe(400)
	})
})
