/**
 * REST API Client — 封裝 WordPress / WooCommerce / Power Partner API 操作
 *
 * 提供帶認證的 HTTP 方法，以及 DELETE with body 的特殊版本。
 */
import type { APIRequestContext } from '@playwright/test'

export type ApiOptions = {
	request: APIRequestContext
	baseURL: string
	nonce: string
}

/** 建立認證 header */
const headers = (nonce: string) => ({
	'X-WP-Nonce': nonce,
	'Content-Type': 'application/json',
})

/** GET 請求，支援 query params，回傳 status、data、headers */
export async function wpGet<T = unknown>(
	opts: ApiOptions,
	endpoint: string,
	params?: Record<string, string>,
): Promise<{ data: T; status: number; headers: Record<string, string> }> {
	const url = new URL(`${opts.baseURL}/wp-json/${endpoint}`)
	if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
	const res = await opts.request.get(url.toString(), { headers: headers(opts.nonce) })
	const data = res.status() < 500 ? await res.json().catch(() => ({})) : await res.json().catch(() => ({}))
	return {
		data: data as T,
		status: res.status(),
		headers: Object.fromEntries(res.headersArray().map(h => [h.name.toLowerCase(), h.value])),
	}
}

/** POST 請求，回傳 status 和 data */
export async function wpPost<T = unknown>(
	opts: ApiOptions,
	endpoint: string,
	data: Record<string, unknown>,
): Promise<{ data: T; status: number }> {
	const res = await opts.request.post(`${opts.baseURL}/wp-json/${endpoint}`, {
		headers: headers(opts.nonce),
		data,
	})
	const body = await res.json().catch(() => ({}))
	return { data: body as T, status: res.status() }
}

/** PUT 請求 */
export async function wpPut<T = unknown>(
	opts: ApiOptions,
	endpoint: string,
	data: Record<string, unknown>,
): Promise<{ data: T; status: number }> {
	const res = await opts.request.put(`${opts.baseURL}/wp-json/${endpoint}`, {
		headers: headers(opts.nonce),
		data,
	})
	const body = await res.json().catch(() => ({}))
	return { data: body as T, status: res.status() }
}

/** DELETE 請求（不帶 body） */
export async function wpDelete<T = unknown>(
	opts: ApiOptions,
	endpoint: string,
): Promise<{ data: T; status: number }> {
	const res = await opts.request.delete(`${opts.baseURL}/wp-json/${endpoint}`, {
		headers: headers(opts.nonce),
	})
	const body = await res.json().catch(() => ({}))
	return { data: body as T, status: res.status() }
}

/** DELETE 請求（帶 body，如 /license-codes） */
export async function wpDeleteWithBody<T = unknown>(
	opts: ApiOptions,
	endpoint: string,
	data: Record<string, unknown>,
): Promise<{ data: T; status: number }> {
	const res = await opts.request.delete(`${opts.baseURL}/wp-json/${endpoint}`, {
		headers: headers(opts.nonce),
		data,
	})
	const body = await res.json().catch(() => ({}))
	return { data: body as T, status: res.status() }
}

/** 從 wp-admin 頁面提取 WP REST Nonce */
export async function extractNonce(page: import('@playwright/test').Page, baseURL: string): Promise<string> {
	await page.goto(`${baseURL}/wp-admin/`)
	await page.waitForLoadState('domcontentloaded')
	const nonce = await page.evaluate(() => (window as any).wpApiSettings?.nonce ?? '')
	if (!nonce) {
		throw new Error('無法提取 WP REST nonce，請確認管理員已登入')
	}
	return nonce
}
