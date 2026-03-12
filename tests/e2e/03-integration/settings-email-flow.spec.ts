/**
 * 設定 + Email 模板整合流程測試
 *
 * 測試: 儲存設定(含 email) → 查詢 email → 修改 → 驗證更新 → 發送帳密 Email
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, TEST_SITE_CREDENTIALS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

test.describe('設定 + Email 模板整合流程', () => {
	const CUSTOM_SUBJECT = 'Integration Test - ##DOMAIN## is Ready!'

	test('Step 1: 儲存設定（含 Email 模板 + disable_site_after_n_days）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 10,
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: CUSTOM_SUBJECT,
					body: '<p>Dear customer, your site ##DOMAIN## is ready.</p>',
					days: '0',
					operator: 'after',
				},
				{
					key: 'subscription_failed',
					enabled: '0',
					action_name: 'subscription_failed',
					subject: 'Payment Failed',
					body: '<p>Payment failed for your subscription.</p>',
					days: '3',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('Step 2: 查詢 Email 模板確認設定', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const templates = res.data as Array<Record<string, string>>
		expect(Array.isArray(templates)).toBe(true)

		const siteSyncTpl = templates.find((t) => t.key === 'site_sync')
		expect(siteSyncTpl).toBeDefined()
		expect(siteSyncTpl!.subject).toBe(CUSTOM_SUBJECT)
		expect(siteSyncTpl!.enabled).toBe('1')

		const failedTpl = templates.find((t) => t.key === 'subscription_failed')
		expect(failedTpl).toBeDefined()
		expect(failedTpl!.enabled).toBe('0')
	})

	test('Step 3: 更新 Email 模板（啟用 subscription_failed）', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: CUSTOM_SUBJECT,
					body: '<p>Updated body</p>',
					days: '0',
					operator: 'after',
				},
				{
					key: 'subscription_failed',
					enabled: '1',
					action_name: 'subscription_failed',
					subject: 'Payment Failed - Updated',
					body: '<p>Updated: Payment failed.</p>',
					days: '5',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	test('Step 4: 驗證更新後的模板', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const failedTpl = (res.data as Array<Record<string, string>>).find(
			(t) => t.key === 'subscription_failed',
		)
		expect(failedTpl?.enabled).toBe('1')
		expect(failedTpl?.days).toBe('5')
	})

	test('Step 5: 使用已啟用的 site_sync 模板發送帳密 Email', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: TEST_SITE_CREDENTIALS.domain,
			password: TEST_SITE_CREDENTIALS.password,
			username: TEST_SITE_CREDENTIALS.username,
			adminEmail: TEST_SITE_CREDENTIALS.adminEmail,
		})
		// Email 可能送失敗（測試環境無 SMTP），但不應回 404（模板存在且啟用）
		expect(res.status).not.toBe(404)
	})
})
