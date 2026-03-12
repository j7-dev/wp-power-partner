/**
 * Playwright Global Setup
 *
 * 測試開始前執行：
 * 1. 套用 LC bypass（注入 'lc' => false 到 plugin.php）
 * 2. 登入 WordPress Admin 並儲存認證狀態
 * 3. 取得 WP REST Nonce
 * 4. 刷新永久連結（flush rewrite rules）
 * 5. 停用 WooCommerce Coming Soon 模式
 */
import { chromium, type FullConfig } from '@playwright/test'
import { applyLcBypass } from './helpers/lc-bypass.js'
import { AUTH_FILE, NONCE_FILE } from './helpers/admin-setup.js'
import { extractNonce } from './helpers/api-client.js'
import { WP_ADMIN } from './fixtures/test-data.js'
import path from 'path'
import fs from 'fs'

async function globalSetup(config: FullConfig): Promise<void> {
	const baseURL =
		config.projects[0]?.use?.baseURL || 'http://localhost:8895'

	// 1. 套用 LC bypass
	console.log('[Global Setup] Applying LC bypass...')
	applyLcBypass()

	// 2. 確保 .auth 目錄存在
	const authDir = path.dirname(AUTH_FILE)
	if (!fs.existsSync(authDir)) {
		fs.mkdirSync(authDir, { recursive: true })
	}

	// 3. 登入 WordPress Admin 並儲存 storageState
	console.log('[Global Setup] Logging in to WordPress Admin...')
	const browser = await chromium.launch()
	const context = await browser.newContext()
	const page = await context.newPage()

	try {
		await context.addCookies([
			{
				name: 'wordpress_test_cookie',
				value: 'WP+Cookie+check',
				domain: new URL(baseURL).hostname,
				path: '/',
			},
		])

		await page.goto(`${baseURL}/wp-login.php`, {
			waitUntil: 'domcontentloaded',
			timeout: 30_000,
		})

		await page.fill('#user_login', WP_ADMIN.username)
		await page.fill('#user_pass', WP_ADMIN.password)
		await page.click('#wp-submit')
		await page.waitForURL(/wp-admin/, { timeout: 60_000 })

		console.log('[Global Setup] Login successful, saving storage state...')
		await context.storageState({ path: AUTH_FILE })

		// 4. 取得 WP REST Nonce
		const nonce = await extractNonce(page, baseURL)
		fs.writeFileSync(NONCE_FILE, nonce)
		console.log('[Global Setup] Nonce saved.')

		// 5. 刷新永久連結（flush rewrite rules）
		console.log('[Global Setup] Flushing rewrite rules...')
		try {
			await page.goto(`${baseURL}/wp-admin/options-permalink.php`, {
				waitUntil: 'domcontentloaded',
				timeout: 30_000,
			})
			await page.click('#submit')
			await page.waitForURL(/options-permalink/, { timeout: 30_000 })
			console.log('[Global Setup] Rewrite rules flushed.')
		} catch (e) {
			console.warn('[Global Setup] Flush rewrite rules warning:', e)
		}

		// 6. 停用 WooCommerce "Coming Soon" 模式
		console.log('[Global Setup] Disabling WooCommerce Coming Soon...')
		try {
			await context.request.post(`${baseURL}/wp-json/wp/v2/settings`, {
				headers: { 'X-WP-Nonce': nonce },
				data: { woocommerce_coming_soon: 'no' },
			})
		} catch (e) {
			console.warn('[Global Setup] Coming Soon disable (non-fatal):', e)
		}
	} catch (error) {
		console.error('[Global Setup] Failed:', error)
		throw error
	} finally {
		await browser.close()
	}

	console.log('[Global Setup] Complete.')
}

export default globalSetup
