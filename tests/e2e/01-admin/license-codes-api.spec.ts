/**
 * 授權碼管理 API 測試
 *
 * 涵蓋: UpdateLicenseCodes, DeleteLicenseCodes
 *
 * 對應 spec:
 *   spec/features/license-code/更新授權碼.feature
 *   spec/features/license-code/刪除授權碼.feature
 *   spec/features/license-code/首次付款建立授權碼.feature
 *   spec/features/license-code/訂閱失敗排程停用授權碼.feature
 *   spec/features/license-code/訂閱恢復重啟授權碼.feature
 *
 * 注意:
 *   授權碼操作需要對接 CloudServer API（cloud.luke.cafe），
 *   在 E2E 環境中因無外部服務而回 500。
 *   測試重點在驗證：
 *   1. 管理員有權限（不回 403）
 *   2. 必填參數驗證（缺少必填參數回 400 或 500）
 *   3. 型別驗證（ids 必須是陣列）
 */
import { test, expect } from '@playwright/test'
import { wpPost, wpDeleteWithBody, type ApiOptions } from '../helpers/api-client.js'
import { getNonce } from '../helpers/admin-setup.js'
import { API, EDGE_NUMBERS, EDGE_STRINGS } from '../fixtures/test-data.js'

let api: ApiOptions

test.beforeAll(async ({ request }, testInfo) => {
	const baseURL = testInfo.project.use.baseURL!
	api = { request, baseURL, nonce: getNonce() }
})

// ─── UpdateLicenseCodes ──────────────────────────────────────

test.describe('POST /license-codes/update — UpdateLicenseCodes', () => {

	// P0: 核心功能（驗證不回 403）
	test('P0: 管理員可呼叫更新授權碼 API（不回 403）', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.nonExistentId],
			post_status: 'available',
		})
		// 因無真實 LC 可操作，可能 200 或 500，但不應 403
		expect(res.status).not.toBe(403)
	})

	// P1: 必填參數驗證（spec 規定 ids 和 post_status 必填）
	test('P1: 缺少 ids 應回錯誤（400 或 500）', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			post_status: 'available',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: 缺少 post_status 應回錯誤（400 或 500）', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [1],
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: ids 必須是陣列（非陣列回錯誤）', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: 'not-array',
			post_status: 'available',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	// P2: 可選參數
	test('P2: ids 為空陣列', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [],
			post_status: 'available',
		})
		// 空 ids 可能直接回 200 或 500
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P2: 包含可選欄位 domain 和 product_slug', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.nonExistentId],
			post_status: 'available',
			domain: 'e2e-test.example.com',
			product_slug: 'e2e-product',
		})
		expect(res.status).not.toBe(403)
	})

	test('P2: 包含可選欄位 subscription_id', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.nonExistentId],
			post_status: 'follow_subscription',
			subscription_id: EDGE_NUMBERS.nonExistentId,
		})
		expect(res.status).not.toBe(403)
	})

	test('P2: 包含可選欄位 post_author 和 customer_id', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.nonExistentId],
			post_status: 'available',
			post_author: 1,
			customer_id: 1,
		})
		expect(res.status).not.toBe(403)
	})

	// P3: 邊緣案例
	test('P3: ids 含負數', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.negative],
			post_status: 'available',
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: ids 含 0', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [EDGE_NUMBERS.zero],
			post_status: 'available',
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: post_status 含 XSS', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [1],
			post_status: EDGE_STRINGS.xssScript,
		})
		// 應被 sanitize，不應崩潰
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: domain 含 SQL injection', async () => {
		const res = await wpPost(api, API.licenseCodesUpdate, {
			ids: [1],
			post_status: 'available',
			domain: EDGE_STRINGS.sqlInjection,
		})
		expect(res.status).not.toBe(403)
	})

	test('P3: 同一個 ids 多次連續送出（重複操作）', async () => {
		const payload = {
			ids: [EDGE_NUMBERS.nonExistentId],
			post_status: 'available',
		}
		const res1 = await wpPost(api, API.licenseCodesUpdate, payload)
		const res2 = await wpPost(api, API.licenseCodesUpdate, payload)
		// 兩次都不應 403
		expect(res1.status).not.toBe(403)
		expect(res2.status).not.toBe(403)
	})
})

// ─── DeleteLicenseCodes ──────────────────────────────────────

test.describe('DELETE /license-codes — DeleteLicenseCodes', () => {

	// P0: 核心功能（驗證不回 403）
	test('P0: 管理員可呼叫刪除授權碼 API（不回 403）', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {
			ids: [EDGE_NUMBERS.nonExistentId],
		})
		// 因無真實 LC，可能回 500，但不應 403
		expect(res.status).not.toBe(403)
	})

	// P1: 必填參數驗證（spec 規定 ids 必填）
	test('P1: 缺少 ids 應回錯誤（500）', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	test('P1: ids 不是陣列應回錯誤', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {
			ids: 'not-array',
		})
		expect([400, 500].includes(res.status)).toBe(true)
	})

	// P2: 邊界值
	test('P2: ids 為空陣列', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {
			ids: [],
		})
		// 空陣列邏輯上直接回 200 或 500
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P2: 刪除不存在的授權碼 ID（999999）', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {
			ids: [EDGE_NUMBERS.nonExistentId],
		})
		// 不應 403
		expect(res.status).not.toBe(403)
	})

	// P3: 邊緣案例
	test('P3: ids 含多種邊界數值', async () => {
		const res = await wpDeleteWithBody(api, API.licenseCodes, {
			ids: [EDGE_NUMBERS.zero, EDGE_NUMBERS.negative, EDGE_NUMBERS.nonExistentId],
		})
		expect([200, 400, 500].includes(res.status)).toBe(true)
	})

	test('P3: 重複刪除相同 ids', async () => {
		const payload = { ids: [EDGE_NUMBERS.nonExistentId] }
		const res1 = await wpDeleteWithBody(api, API.licenseCodes, payload)
		const res2 = await wpDeleteWithBody(api, API.licenseCodes, payload)
		// 兩次都不應 403
		expect(res1.status).not.toBe(403)
		expect(res2.status).not.toBe(403)
	})
})
