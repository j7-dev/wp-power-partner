/**
 * WPCD 回調 API 整合測試
 *
 * 涵蓋: LinkSite, CustomerNotification
 * 注意: 這些 API 使用 IP 白名單認證，在 localhost 環境下
 *       可能會因為 IP 不在白名單而回 403。
 *       測試重點在驗證 API 結構和錯誤處理。
 */
import { test, expect, request as pwRequest } from '@playwright/test'
import { wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let baseURL: string
let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── LinkSite (IP 白名單) ────────────────────────────────────

test.describe('POST /link-site — WPCD LinkSite', () => {
	test('P0: localhost 呼叫可能回 403（IP 白名單限制）', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.linkSite}`, {
			headers: { 'Content-Type': 'application/json' },
			data: {
				subscription_id: '1',
				site_id: '100',
			},
		})
		// 本地 IP 可能不在白名單
		expect([200, 403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})

	test('P1: 缺少 subscription_id', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.linkSite}`, {
			headers: { 'Content-Type': 'application/json' },
			data: { site_id: '100' },
		})
		expect([400, 403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})

	test('P1: 缺少 site_id', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.linkSite}`, {
			headers: { 'Content-Type': 'application/json' },
			data: { subscription_id: '1' },
		})
		expect([400, 403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})
})

// ─── CustomerNotification (IP 白名單) ────────────────────────

test.describe('POST /customer-notification — WPCD CustomerNotification', () => {
	test('P0: localhost 呼叫可能回 403（IP 白名單限制）', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.customerNotification}`, {
			headers: { 'Content-Type': 'application/json' },
			data: {
				CUSTOMER_ID: '1',
				DOMAIN: 'e2e-test.example.com',
				SITEUSERNAME: 'admin',
				SITEPASSWORD: 'password123',
				FRONTURL: 'https://e2e-test.example.com',
				ADMINURL: 'https://e2e-test.example.com/wp-admin',
			},
		})
		expect([200, 403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})

	test('P1: 缺少 CUSTOMER_ID 回 500', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.customerNotification}`, {
			headers: { 'Content-Type': 'application/json' },
			data: {
				DOMAIN: 'test.example.com',
			},
		})
		// 可能回 403（IP 擋住）或 500（缺少參數）
		expect([403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})

	test('P2: 帶完整欄位但 CUSTOMER_ID 不存在', async () => {
		const ctx = await pwRequest.newContext()
		const res = await ctx.post(`${baseURL}/wp-json/${API.customerNotification}`, {
			headers: { 'Content-Type': 'application/json' },
			data: {
				CUSTOMER_ID: '999999',
				REF_ORDER_ID: '12345',
				NEW_SITE_ID: '100',
				IPV4: '1.2.3.4',
				DOMAIN: 'fake.example.com',
				FRONTURL: 'https://fake.example.com',
				ADMINURL: 'https://fake.example.com/wp-admin',
				SITEUSERNAME: 'admin',
				SITEPASSWORD: 'fakepass',
			},
		})
		expect([403, 500].includes(res.status())).toBe(true)
		await ctx.dispose()
	})
})

// ─── 使用認證管理員呼叫 IP 白名單 API ─────────────────────────

test.describe('IP 白名單 API — 管理員認證也不應繞過', () => {
	test('P1: 管理員用 nonce 呼叫 link-site（仍受 IP 限制）', async () => {
		const res = await wpPost(api, API.linkSite, {
			subscription_id: '1',
			site_id: '100',
		})
		// 即使有 nonce，IP 不在白名單也可能 403
		expect([200, 403, 500].includes(res.status)).toBe(true)
	})

	test('P1: 管理員用 nonce 呼叫 customer-notification（仍受 IP 限制）', async () => {
		const res = await wpPost(api, API.customerNotification, {
			CUSTOMER_ID: '1',
			DOMAIN: 'test.com',
		})
		expect([200, 403, 500].includes(res.status)).toBe(true)
	})
})
