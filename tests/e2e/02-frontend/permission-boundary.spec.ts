/**
 * 權限邊界測試 — 未認證 / 權限不足
 *
 * 驗證所有需要 manage_options 權限的 API 端點在未認證時回 401/403。
 */
import { test, expect, request as pwRequest } from '@playwright/test'

let baseURL: string

test.beforeAll(async ({}, testInfo) => {
	baseURL = testInfo.project.use.baseURL!
})

/**
 * 以完全未認證的方式發送請求（無 cookie、無 nonce）
 */
async function unauthGet(endpoint: string, params?: Record<string, string>) {
	const ctx = await pwRequest.newContext()
	const url = new URL(`${baseURL}/wp-json/${endpoint}`)
	if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
	const res = await ctx.get(url.toString())
	const status = res.status()
	await ctx.dispose()
	return status
}

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

async function unauthDelete(endpoint: string) {
	const ctx = await pwRequest.newContext()
	const res = await ctx.delete(`${baseURL}/wp-json/${endpoint}`)
	const status = res.status()
	await ctx.dispose()
	return status
}

// ─── Settings 需要認證 ──────────────────────────────────────

test.describe('權限守衛: Settings', () => {
	test('POST /settings 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/settings', {
			power_partner_disable_site_after_n_days: 7,
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('POST /powercloud-api-key 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/powercloud-api-key', {
			api_key: 'test',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('GET /emails 未認證回 401/403', async () => {
		const status = await unauthGet('power-partner/emails')
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Partner 需要認證 ────────────────────────────────────────

test.describe('權限守衛: Partner', () => {
	test('POST /partner-id 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/partner-id', {
			partner_id: 'test',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('DELETE /partner-id 未認證回 401/403', async () => {
		const status = await unauthDelete('power-partner/partner-id')
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Site Sync 需要認證 ──────────────────────────────────────

test.describe('權限守衛: Site Sync', () => {
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
			domain: 'test.com',
			password: 'test',
		})
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── Subscription 需要認證 ───────────────────────────────────

test.describe('權限守衛: Subscription', () => {
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

	test('GET /customers-by-search 未認證回 401/403', async () => {
		const status = await unauthGet('power-partner/customers-by-search', {
			search: 'admin',
		})
		expect([401, 403].includes(status)).toBe(true)
	})
})

// ─── License Codes 需要認證 ──────────────────────────────────

test.describe('權限守衛: License Codes', () => {
	test('POST /license-codes/update 未認證回 401/403', async () => {
		const status = await unauthPost('power-partner/license-codes/update', {
			ids: [1],
			post_status: 'available',
		})
		expect([401, 403].includes(status)).toBe(true)
	})

	test('DELETE /license-codes 未認證回 401/403', async () => {
		const status = await unauthDelete('power-partner/license-codes')
		expect([401, 403].includes(status)).toBe(true)
	})
})
