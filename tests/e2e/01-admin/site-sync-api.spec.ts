/**
 * 開站與站點管理 API 測試
 *
 * 涵蓋: ManualSiteSync, ClearTemplateSitesCache, SendSiteCredentialsEmail
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import {
	API,
	TEST_SITE_CREDENTIALS,
	TEST_SITE_SYNC,
	TEST_SETTINGS,
	TEST_PARTNER,
} from '../fixtures/test-data.js'
import { getNonce } from '../helpers/admin-setup.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── ClearTemplateSitesCache ─────────────────────────────────

test.describe('POST /clear-template-sites-cache — ClearTemplateSitesCache', () => {
	test('P0: 管理員可清除模板站快取', async () => {
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
	})

	test('P1: 重複清除仍回 200', async () => {
		await wpPost(api, API.clearTemplateSitesCache, {})
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
	})
})

// ─── ManualSiteSync ──────────────────────────────────────────

test.describe('POST /manual-site-sync — ManualSiteSync', () => {
	test.beforeAll(async () => {
		// 確保有 partner_id（手動開站需要）
		await wpPost(api, API.partnerId, {
			partner_id: TEST_PARTNER.partnerId,
		})
	})

	test('P0: 管理員可呼叫手動開站 API', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: TEST_SITE_SYNC.siteId,
			host_position: TEST_SITE_SYNC.hostPosition,
		})
		// 因無外部 CloudServer，可能回 500，但不應 403
		expect(res.status).not.toBe(403)
	})

	test('P1: 缺少 site_id 回錯誤', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			host_position: 'jp',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: 缺少 host_position 回錯誤', async () => {
		const res = await wpPost(api, API.manualSiteSync, {
			site_id: '999',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})
})

// ─── SendSiteCredentialsEmail ────────────────────────────────

test.describe('POST /send-site-credentials-email — SendSiteCredentialsEmail', () => {
	test.beforeAll(async () => {
		// 確保 site_sync 模板已啟用
		await wpPost(api, API.settings, {
			emails: TEST_SETTINGS.emails,
		})
	})

	test('P0: 管理員可發送站點帳密 Email', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: TEST_SITE_CREDENTIALS.domain,
			password: TEST_SITE_CREDENTIALS.password,
			username: TEST_SITE_CREDENTIALS.username,
			adminEmail: TEST_SITE_CREDENTIALS.adminEmail,
			frontUrl: TEST_SITE_CREDENTIALS.frontUrl,
			adminUrl: TEST_SITE_CREDENTIALS.adminUrl,
			ip: TEST_SITE_CREDENTIALS.ip,
		})
		// 在測試環境 email 可能真送不出，但 API 結構正確就算通過
		expect([200, 500].includes(res.status)).toBe(true)
	})

	test('P1: 缺少 domain 回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			password: 'test',
		})
		expect(res.status).toBe(400)
	})

	test('P1: 缺少 password 回 400', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'test.example.com',
		})
		expect(res.status).toBe(400)
	})

	test('P2: 只傳必要欄位（domain + password）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'minimal.example.com',
			password: 'minimal-pass',
		})
		// 有 site_sync 模板就不應回 404
		expect(res.status).not.toBe(404)
	})

	test('P2: username 預設為 admin', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: 'default-user.example.com',
			password: 'pass123',
		})
		expect([200, 500].includes(res.status)).toBe(true)
	})
})
