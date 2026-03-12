/**
 * 授權碼管理 API 測試
 *
 * 涵蓋: UpdateLicenseCodes, DeleteLicenseCodes
 * 注意: 授權碼操作需要對接 CloudServer API，在 E2E 環境中可能因無外部服務而回 500。
 *       測試重點在驗證權限守衛與參數驗證。
 */
import { test, expect } from '@playwright/test'
import { wpPost, wpDelete, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── UpdateLicenseCodes ──────────────────────────────────────

test.describe('POST /license-codes/update — UpdateLicenseCodes', () => {
	test('P0: 管理員可呼叫更新授權碼 API', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [99999],
			post_status: 'available',
		})
		// 可能 200 或 500（無真實 LC 可操作），但不應 403
		expect(res.status).not.toBe(403)
	})

	test('P1: 缺少 ids 應回錯誤', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			post_status: 'available',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: 缺少 post_status 應回錯誤', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [1],
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P2: ids 為空陣列', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [],
			post_status: 'available',
		})
		// 空 ids 可能直接 200 或 500
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P2: 包含可選欄位（domain, product_slug）', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [99999],
			post_status: 'available',
			domain: 'e2e-test.example.com',
			product_slug: 'e2e-product',
		})
		expect(res.status).not.toBe(403)
	})
})

// ─── DeleteLicenseCodes ──────────────────────────────────────

test.describe('DELETE /license-codes — DeleteLicenseCodes', () => {
	test('P0: 管理員可呼叫刪除授權碼 API', async () => {
		const res = await wpDelete(api, API.licenseCodes)
		// DELETE 需要 body with ids，但 wpDelete 不帶 body
		// 預期回 500（缺少 ids）或其他非 403 狀態
		expect(res.status).not.toBe(403)
	})

	test('P1: 刪除不存在的授權碼 ID', async () => {
		// 使用 wpPost 模擬 DELETE with body（某些框架需要）
		const res = await wpPost(api, API.licenseCodes, {
			ids: [99999],
		})
		// 可能回 200 或 500，不應 403
		expect(res.status).not.toBe(403)
	})
})
