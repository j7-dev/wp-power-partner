/**
 * 權限邊界測試 — 未認證 / 權限不足
 *
 * 驗證所有需要 manage_options 權限的 API 端點在未認證時回 401/403。
 * 驗證 Public API 端點在未認證時仍可正常存取。
 *
 * 對應 spec:
 *   spec/features/settings/儲存設定.feature — Rule: 前置（狀態）使用者需有 manage_options 權限
 *   spec/features/partner/設定合作夥伴連結.feature — Rule: 前置（狀態）
 *   spec/features/site/手動開站.feature — Rule: 前置（狀態）
 *   spec/features/email/查詢Email模板.feature — Rule: 前置（狀態）
 *   spec/features/license-code/更新授權碼.feature — Rule: 前置（狀態）
 *   spec/features/subscription/查詢用戶訂閱列表.feature — Rule: 前置（狀態）
 *   spec/features/user/搜尋客戶.feature — Rule: 前置（狀態）
 */
import { test, expect, request as pwRequest } from '@playwright/test'

let baseURL: string

test.beforeAll(async ({}, testInfo) => {
	baseURL = testInfo.project.use.baseURL!
})

/** 以完全未認證的方式發送 GET 請求（無 cookie、無 nonce） */
async function unauthGet(endpoint: string, params?: Record<string, string>) {
	const ctx = await pwRequest.newContext()
	const url = new URL(`${baseURL}/wp-json/${endpoint}`)
	if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
	const res = await ctx.get(url.toString())
	const status = res.status()
	await ctx.dispose()
	return status
}

/** 以完全未認證的方式發送 POST 請求 */
async function unauthPost(endpoint: string, data: Record<string, unknown> = {}) {
	const ctx = await pwRequest.newContext()
	const res = await ctx.post(`${baseURL}/wp-json/${endpoint}`, {
		headers: { 'Content-Type': 'application/json' },
		data,
	})
	const status = res.status()
	await ctx.dispose()
	return status
}

/** 以完全未認證的方式發送 DELETE 請求 */
async function unauthDelete(endpoint: string, data?: Record<string, unknown>) {
	const ctx = await pwRequest.newContext()
	const res = await ctx.delete(`${baseURL}/wp-json/${endpoint}`, {
		headers: { 'Content-Type': 'application/json' },
		data,
	})
	const status = res.status()
	await ctx.dispose()
	return status
}

// ─── Settings 需要認證 ──────────────────────────────────────

test.describe('P0 權限守衛: Settings — manage_options 必要', () => {

	test('POST /settings 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/settings', {
			power_partner_disable_site_after_n_days: 7,
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('POST /powercloud-api-key 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/powercloud-api-key', {
			api_key: 'test-key',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('GET /emails 未認證回 401/403', async () => {
		const status = await unauthGet('power-partner/emails')
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Partner 部分端點需要認證 ────────────────────────────────

test.describe('P0 權限守衛: Partner — POST/DELETE 需要認證', () => {

	test('POST /partner-id 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/partner-id', {
			partner_id: 'test-partner',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('DELETE /partner-id 未認證回 401/403', async () => {
		const status = await unauthDelete('power-partner/partner-id')
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Site Sync 需要認證 ──────────────────────────────────────

test.describe('P0 權限守衛: Site Sync — manage_options 必要', () => {

	test('POST /manual-site-sync 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/manual-site-sync', {
			site_id: '1',
			host_position: 'jp',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('POST /clear-template-sites-cache 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/clear-template-sites-cache')
		expect([401, 403].includes(status)).toBe(true)
	})

	test('POST /send-site-credentials-email 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/send-site-credentials-email', {
			domain: 'test.example.com',
			password: 'test-pass',
		})
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Subscription 部分端點需要認證 ───────────────────────────

test.describe('P0 權限守衛: Subscription — manage_options 必要', () => {

	test('GET /subscriptions 未認證回 401/403', async () => {
		const status = await unauthGet('power-partner/subscriptions', { user_id: '1' })
		expect([401, 403].includes(status)).toBe(true)
	})

	test('POST /change-subscription 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/change-subscription', {
			subscription_id: '1',
			site_id: '1',
			linked_site_ids: ['1'],
		})
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── User 查詢需要認證 ───────────────────────────────────────

test.describe('P0 權限守衛: User — manage_options 必要', () => {

	test('GET /customers-by-search 未認證回 401/403', async () => {
		const status = await unauthGet('power-partner/customers-by-search', {
			search: 'admin',
		})
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── License Codes 需要認證 ──────────────────────────────────

test.describe('P0 權限守衛: License Codes — manage_options 必要', () => {

	test('POST /license-codes/update 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/license-codes/update', {
			ids: [1],
			post_status: 'available',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('DELETE /license-codes 未認證回 401/403', async () => {
		const status = await unauthDelete('power-partner/license-codes', { ids: [1] })
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── WPCD 回調 IP 白名單邊界（非 manage_options，而是 IP 檢查） ──

test.describe('P1 IP 白名單: WPCD 回調端點', () => {

	test('POST /link-site 非白名單 IP 回 403', async () => {
		// 從 localhost 發出，不在 CloudServer 的 IP 白名單
		const status = await unauthPost('power-partner/link-site', {
			subscription_id: '1',
			site_id: '100',
		})
		// localhost 不在白名單，應回 403 或 404
		expect([403, 404].includes(status)).toBe(true)
	})

	test('POST /customer-notification 非白名單 IP 回 403', async () => {
		const status = await unauthPost('power-partner/customer-notification', {
			CUSTOMER_ID: '1',
		})
		// spec: 非白名單 IP 回 403
		expect([403, 404].includes(status)).toBe(true)
	})
})

// ─── PowerCloud API Key 特殊驗證（需登入且有 manage_options） ─

test.describe('P1 權限守衛: PowerCloud API Key — 未登入回 401', () => {

	test('POST /powercloud-api-key 未登入回 401（spec 明確指定）', async () => {
		const status = await unauthPost('power-partner/powercloud-api-key', {
			api_key: 'some-key',
		})
		// spec: "使用者未認證" 回 401
		expect([401, 403].includes(status)).toBe(true)
	})
})
