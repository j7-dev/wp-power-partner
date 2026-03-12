/**
 * 合作夥伴完整生命週期整合測試
 *
 * 測試流程: 設定 Partner → 查詢 → 更新 → 查詢帳號資訊 → 刪除 → 確認刪除
 */
import { test, expect } from '@playwright/test'
import { wpGet, wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

test.describe('合作夥伴生命週期', () => {
	const PARTNER_ID = 'lifecycle-test-partner'
	const ENCRYPTED_INFO = 'lifecycle-encrypted-info'
	const TEMPLATE_OPTS = { 'tpl-lc': 'Lifecycle Template' }

	test('Step 1: 設定合作夥伴連結', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: PARTNER_ID,
			encrypted_account_info: ENCRYPTED_INFO,
			allowed_template_options: TEMPLATE_OPTS,
		})
		expect(res.status).toBe(200)
	})

	test('Step 2: 查詢合作夥伴 ID 確認設定成功', async () => {
		const res = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(res.status).toBe(200)
		expect((res.data as { data: { partner_id: string } }).data.partner_id).toBe(PARTNER_ID)
	})

	test('Step 3: 查詢帳號資訊確認 encrypted_account_info', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		expect(
			(res.data as { data: { encrypted_account_info: string } }).data
				.encrypted_account_info,
		).toBe(ENCRYPTED_INFO)
	})

	test('Step 4: 更新合作夥伴 ID', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: 'updated-partner-id',
			encrypted_account_info: 'updated-info',
		})
		expect(res.status).toBe(200)

		const verify = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(
			(verify.data as { data: { partner_id: string } }).data.partner_id,
		).toBe('updated-partner-id')
	})

	test('Step 5: 刪除合作夥伴連結', async () => {
		const res = await wpDelete(api, API.partnerId)
		expect(res.status).toBe(200)
	})

	test('Step 6: 確認刪除後查詢狀態', async () => {
		const res = await wpGet(api, API.partnerId)
		// 已刪除後可能回 500 或 partner_id 為空
		if (res.status === 200) {
			const body = res.data as { data?: { partner_id?: string } }
			expect(!body.data?.partner_id || body.data.partner_id === '').toBe(true)
		} else {
			expect(res.status).toBe(500)
		}
	})
})
