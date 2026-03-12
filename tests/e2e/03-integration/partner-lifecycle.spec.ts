/**
 * 合作夥伴完整生命週期整合測試
 *
 * 測試完整流程:
 *   設定 Partner → 查詢 partner_id → 查詢 account_info
 *   → 清除快取 → 更新 partner_id → 刪除 → 確認已刪除
 *
 * 對應 spec:
 *   spec/activities/合作夥伴管理流程.activity
 *   spec/features/partner/設定合作夥伴連結.feature
 *   spec/features/partner/查詢合作夥伴ID.feature
 *   spec/features/partner/查詢帳號資訊.feature
 *   spec/features/partner/刪除合作夥伴連結.feature
 *   spec/features/cache/清除模板站快取.feature
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

test.describe('合作夥伴完整生命週期', () => {
	const PARTNER_ID = 'e2e-lifecycle-partner-001'
	const ENCRYPTED_INFO = 'e2e-lifecycle-encrypted-info'
	const TEMPLATE_OPTS = {
		'tpl-lifecycle-1': 'E2E Lifecycle Template A',
		'tpl-lifecycle-2': 'E2E Lifecycle Template B',
	}

	// Step 1: 設定合作夥伴連結
	test('Step 1: 設定合作夥伴連結（含完整參數）', async () => {
		const res = await wpPost(api, API.partnerId, {
			partner_id: PARTNER_ID,
			encrypted_account_info: ENCRYPTED_INFO,
			allowed_template_options: TEMPLATE_OPTS,
		})
		expect(res.status).toBe(200)
	})

	// Step 2: 查詢合作夥伴 ID 確認設定成功
	test('Step 2: GET /partner-id 應回傳剛設定的 partner_id', async () => {
		const res = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(res.status).toBe(200)
		expect((res.data as { data: { partner_id: string } }).data?.partner_id).toBe(PARTNER_ID)
	})

	// Step 3: 查詢帳號資訊確認 encrypted_account_info
	test('Step 3: GET /account-info 應回傳剛設定的加密資訊', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		expect(
			(res.data as { data: { encrypted_account_info: string } }).data?.encrypted_account_info,
		).toBe(ENCRYPTED_INFO)
	})

	// Step 4: 清除模板站快取（設定後應清除舊快取）
	test('Step 4: 清除模板站快取（allowed_template_options transient）', async () => {
		const res = await wpPost(api, API.clearTemplateSitesCache, {})
		expect(res.status).toBe(200)
	})

	// Step 5: 更新合作夥伴 ID
	test('Step 5: 更新 partner_id 並確認覆蓋成功', async () => {
		const UPDATED_ID = 'e2e-lifecycle-partner-updated'
		const res = await wpPost(api, API.partnerId, {
			partner_id: UPDATED_ID,
			encrypted_account_info: 'e2e-updated-encrypted-info',
		})
		expect(res.status).toBe(200)

		// 確認確實被更新
		const verify = await wpGet<{ data: { partner_id: string } }>(api, API.partnerId)
		expect(
			(verify.data as { data: { partner_id: string } }).data?.partner_id,
		).toBe(UPDATED_ID)
	})

	// Step 6: 刪除合作夥伴連結
	test('Step 6: 刪除合作夥伴連結', async () => {
		const res = await wpDelete(api, API.partnerId)
		expect(res.status).toBe(200)
	})

	// Step 7: 確認刪除後查詢狀態
	test('Step 7: 刪除後查詢 partner_id 應為空或 500', async () => {
		const res = await wpGet(api, API.partnerId)
		// spec: 未設定 partner_id 時回錯誤 "fail, partner_id is empty"
		if (res.status === 200) {
			const body = res.data as { data?: { partner_id?: string } }
			expect(!body.data?.partner_id || body.data.partner_id === '').toBe(true)
		} else {
			expect(res.status).toBe(500)
		}
	})

	// Step 8: 確認刪除後帳號資訊為 null
	test('Step 8: 刪除後查詢 account-info 應為 null', async () => {
		const res = await wpGet<{ data: { encrypted_account_info: string | null } }>(
			api,
			API.accountInfo,
		)
		expect(res.status).toBe(200)
		const body = res.data as { data?: { encrypted_account_info?: string | null } }
		expect(
			body.data?.encrypted_account_info == null || body.data?.encrypted_account_info === ''
		).toBe(true)
	})
})
