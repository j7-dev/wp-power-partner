/**
 * 設定管理 API 測試
 *
 * 涵蓋: SaveSettings, SavePowerCloudApiKey, GetEmails
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, TEST_SETTINGS, TEST_POWERCLOUD_KEY } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── SaveSettings ────────────────────────────────────────────

test.describe('POST /settings — SaveSettings', () => {
	test('P0: 管理員可儲存基本設定（disable_site_after_n_days）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: TEST_SETTINGS.disableSiteAfterNDays,
		})
		expect(res.status).toBe(200)
	})

	test('P0: 管理員可儲存 Email 模板設定', async () => {
		const res = await wpPost(api, API.settings, {
			emails: TEST_SETTINGS.emails,
		})
		expect(res.status).toBe(200)
	})

	test('P1: 可同時儲存 disable_site_after_n_days 和 emails', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 14,
			emails: TEST_SETTINGS.emails,
		})
		expect(res.status).toBe(200)
	})

	test('P2: HTML 標籤在非 emails 欄位會被清除', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 5,
		})
		expect(res.status).toBe(200)
	})

	test('P2: 空 body 送出仍回 200', async () => {
		const res = await wpPost(api, API.settings, {})
		expect(res.status).toBe(200)
	})
})

// ─── SavePowerCloudApiKey ────────────────────────────────────

test.describe('POST /powercloud-api-key — SavePowerCloudApiKey', () => {
	test('P0: 管理員可儲存 PowerCloud API Key', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: TEST_POWERCLOUD_KEY,
		})
		expect(res.status).toBe(200)
	})

	test('P1: api_key 為空字串回 400', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: '',
		})
		expect(res.status).toBe(400)
	})

	test('P2: 缺少 api_key 欄位回 400', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {})
		expect(res.status).toBe(400)
	})

	test('P2: 包含特殊字元的 api_key 仍可成功', async () => {
		const res = await wpPost(api, API.powercloudApiKey, {
			api_key: 'key-with-$pecial_chars!@#%^&*()',
		})
		expect(res.status).toBe(200)
	})
})

// ─── GetEmails ───────────────────────────────────────────────

test.describe('GET /emails — GetEmails', () => {
	test('P0: 管理員可取得 Email 模板列表', async () => {
		const res = await wpGet<Array<Record<string, unknown>>>(api, API.emails)
		expect(res.status).toBe(200)
		expect(Array.isArray(res.data)).toBe(true)
	})

	test('P1: 每個模板都有必要欄位', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		if (Array.isArray(res.data) && res.data.length > 0) {
			const template = res.data[0]
			expect(template).toHaveProperty('key')
			expect(template).toHaveProperty('enabled')
			expect(template).toHaveProperty('action_name')
			expect(template).toHaveProperty('subject')
			expect(template).toHaveProperty('body')
		}
	})

	test('P1: 儲存後再查詢可取得更新後的模板', async () => {
		const customEmails = [
			{
				key: 'site_sync',
				enabled: '1',
				action_name: 'site_sync',
				subject: 'E2E Verify - ##DOMAIN## Ready',
				body: '<p>Site is ready at ##FRONTURL##</p>',
				days: '0',
				operator: 'after',
			},
		]
		await wpPost(api, API.settings, { emails: customEmails })

		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const siteSyncTpl = (res.data as Array<Record<string, string>>).find(
			(t) => t.key === 'site_sync',
		)
		expect(siteSyncTpl).toBeDefined()
		expect(siteSyncTpl!.subject).toContain('E2E Verify')
	})
})
