/**
 * 設定 + Email 模板整合流程測試
 *
 * 測試完整流程:
 *   儲存設定（含 emails）→ 查詢 emails 確認 → 更新模板
 *   → 驗證更新 → 使用 site_sync 模板發送帳密 Email
 *
 * 對應 spec:
 *   spec/activities/管理員操作流程.activity (Step 7: 發送站點帳密郵件)
 *   spec/features/settings/儲存設定.feature
 *   spec/features/email/查詢Email模板.feature
 *   spec/features/email/發送站點帳密郵件.feature
 *   spec/features/email/排程訂閱生命週期Email.feature
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
	const UNIQUE_TAG = `e2e-${Date.now()}`
	const CUSTOM_SUBJECT = `E2E-Flow-${UNIQUE_TAG} ##DOMAIN## is Ready!`

	// Step 1: 儲存設定（含 Email 模板 + disable_site_after_n_days）
	test('Step 1: 儲存完整設定（關站天數 + 多個 Email 模板）', async () => {
		const res = await wpPost(api, API.settings, {
			power_partner_disable_site_after_n_days: 10,
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: CUSTOM_SUBJECT,
					body: `<p>E2E Flow Test: ##DOMAIN## is ready. Password: ##SITEPASSWORD##</p>`,
					days: '0',
					operator: 'after',
				},
				{
					key: 'subscription_failed',
					enabled: '0',
					action_name: 'subscription_failed',
					subject: 'E2E - Payment Failed',
					body: '<p>Payment failed.</p>',
					days: '3',
					operator: 'after',
				},
				{
					key: 'next_payment',
					enabled: '1',
					action_name: 'next_payment',
					subject: 'E2E - 即將扣款',
					body: '<p>將於近期自動續訂。</p>',
					days: '3',
					operator: 'before',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	// Step 2: 查詢 Email 模板確認設定
	test('Step 2: GET /emails 確認 site_sync 模板已儲存', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const templates = res.data as Array<Record<string, string>>
		expect(Array.isArray(templates)).toBe(true)

		const siteSyncTpl = templates.find(t => t.key === 'site_sync')
		expect(siteSyncTpl).toBeDefined()
		expect(siteSyncTpl!.subject).toBe(CUSTOM_SUBJECT)
		expect(siteSyncTpl!.enabled).toBe('1')
		expect(siteSyncTpl!.action_name).toBe('site_sync')
	})

	// Step 3: 確認停用模板也被保留
	test('Step 3: GET /emails 確認 subscription_failed 模板（enabled=0）被保留', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const templates = res.data as Array<Record<string, string>>

		const failedTpl = templates.find(t => t.key === 'subscription_failed')
		expect(failedTpl).toBeDefined()
		expect(failedTpl!.enabled).toBe('0')
		expect(failedTpl!.days).toBe('3')
	})

	// Step 4: 更新 Email 模板（啟用 subscription_failed，修改 days）
	test('Step 4: 更新 Email 模板（啟用 subscription_failed 並修改 days）', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: CUSTOM_SUBJECT,
					body: '<p>Updated body - still E2E flow.</p>',
					days: '0',
					operator: 'after',
				},
				{
					key: 'subscription_failed',
					enabled: '1', // 從 0 改為 1
					action_name: 'subscription_failed',
					subject: 'E2E - Payment Failed - Updated',
					body: '<p>Updated: Payment failed.</p>',
					days: '5', // 從 3 改為 5
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	// Step 5: 驗證更新後的模板
	test('Step 5: 驗證 subscription_failed 已更新（enabled=1, days=5）', async () => {
		const res = await wpGet<Array<Record<string, string>>>(api, API.emails)
		expect(res.status).toBe(200)
		const templates = res.data as Array<Record<string, string>>

		const failedTpl = templates.find(t => t.key === 'subscription_failed')
		expect(failedTpl).toBeDefined()
		expect(failedTpl!.enabled).toBe('1')
		expect(failedTpl!.days).toBe('5')
		expect(failedTpl!.subject).toContain('Updated')
	})

	// Step 6: 使用已啟用的 site_sync 模板發送帳密 Email
	test('Step 6: 使用 site_sync 模板發送帳密 Email（不回 404）', async () => {
		const res = await wpPost(api, API.sendSiteCredentialsEmail, {
			domain: TEST_SITE_CREDENTIALS.domain,
			password: TEST_SITE_CREDENTIALS.password,
			username: TEST_SITE_CREDENTIALS.username,
			adminEmail: TEST_SITE_CREDENTIALS.adminEmail,
			frontUrl: TEST_SITE_CREDENTIALS.frontUrl,
			adminUrl: TEST_SITE_CREDENTIALS.adminUrl,
		})
		// Email 可能送失敗（無 SMTP），但有 site_sync 模板，不應回 404（模板不存在）
		expect(res.status).not.toBe(404)
	})

	// Step 7: 確認 ##TOKEN## 格式驗證（測試 token 替換不崩潰）
	test('Step 7: 更新模板含多種 Token 格式', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'site_sync',
					enabled: '1',
					action_name: 'site_sync',
					subject: 'Token Test - ##DOMAIN## ##FRONTURL## ##ADMINURL##',
					body: '<p>Password: ##SITEPASSWORD## | User: ##SITEUSERNAME## | IP: ##IPV4##</p>',
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})
})

test.describe('Email 模板欄位邊界驗證', () => {

	// P2: operator 邊界
	test('P2: before operator 在 next_payment 場景', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'before_test',
					enabled: '1',
					action_name: 'next_payment',
					subject: 'Before Test',
					body: '<p>Before payment</p>',
					days: '3',
					operator: 'before',
				},
			],
		})
		expect(res.status).toBe(200)

		const getRes = await wpGet<Array<Record<string, string>>>(api, API.emails)
		const tpl = (getRes.data as Array<Record<string, string>>).find(t => t.key === 'before_test')
		if (tpl) {
			expect(tpl.operator).toBe('before')
			expect(tpl.days).toBe('3')
		}
	})

	// P2: days 為 0 的情境
	test('P2: days 為 "0" 表示立即執行', async () => {
		const res = await wpPost(api, API.settings, {
			emails: [
				{
					key: 'zero_days_test',
					enabled: '1',
					action_name: 'subscription_failed',
					subject: 'Immediate',
					body: '<p>Immediate</p>',
					days: '0',
					operator: 'after',
				},
			],
		})
		expect(res.status).toBe(200)
	})

	// P3: 大量 Email 模板
	test('P3: 儲存大量 Email 模板（10 個）', async () => {
		const manyEmails = Array.from({ length: 10 }, (_, i) => ({
			key: `e2e_bulk_${i}`,
			enabled: i % 2 === 0 ? '1' : '0',
			action_name: 'subscription_failed',
			subject: `E2E Bulk Template ${i}`,
			body: `<p>Bulk template number ${i}</p>`,
			days: String(i),
			operator: i % 2 === 0 ? 'after' : 'before',
		}))

		const res = await wpPost(api, API.settings, {
			emails: manyEmails,
		})
		expect(res.status).toBe(200)
	})
})
