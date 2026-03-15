---
name: power-partner
description: "Power Partner — WordPress 雲端網站自動開站與合作夥伴訂閱管理外掛開發指引。WooCommerce 訂閱自動建站、授權碼分發、雙 React App（Admin/User）、cloud.luke.cafe + api.wpsite.pro API 整合。使用 /power-partner 觸發。"
origin: project-analyze
---

# power-partner — 開發指引

> WordPress Plugin，讓網站擁有者銷售 WordPress 網站模板（WooCommerce 訂閱制）。訂閱成立時自動透過 PowerCloud/WPCD 後端開站、發送授權碼，訂閱失敗時自動停用網站。

## When to Activate

當使用者在此專案中：
- 修改 `inc/classes/**/*.php`（開站流程、訂閱管理、授權碼邏輯）
- 修改 `js/src/**/*.tsx`（React AdminApp 或 UserApp）
- 新增開站模板、授權碼分發、Email 通知功能
- 詢問 cloud.luke.cafe API、PowerCloud API、WooCommerce Subscriptions、Jotai 狀態管理相關問題

## 架構概覽

**技術棧：**
- **語言**: PHP 8.1+（`declare(strict_types=1)`）
- **框架**: WordPress 5.7+、WooCommerce 7.6+（必要）、Woo Subscriptions 5.9+、Powerhouse 3.3.23+
- **PHP 依賴**: `kucrut/vite-for-wp`、`j7-dev/wp-plugin-trait`
- **前端**: React 18 + TypeScript + TanStack Query v5 + Jotai + Ant Design 5 + Refine
- **建置**: Vite + `@kucrut/vite-for-wp`
- **代碼風格**: PHPCS（WordPress-Core）、PHPStan、ESLint + Prettier

## 目錄結構

```
power-partner/
├── plugin.php                                      # 主入口（PluginTrait + SingletonTrait）
├── inc/classes/
│   ├── Bootstrap.php                               # 初始化所有子模組
│   ├── Order.php                                   # WC 訂單管理欄位
│   ├── ShopSubscription.php                        # 訂閱 meta（pp_linked_site_ids）
│   ├── Shortcode.php                               # 前台短碼
│   ├── Admin/Menu/Setting.php                      # 管理頁面掛載點
│   ├── Api/
│   │   ├── Main.php                                # 核心 REST endpoints
│   │   ├── Connect.php                             # partner-id + account-info
│   │   ├── Fetch.php                               # WPCD API（舊架構，HTTP Basic Auth）
│   │   ├── FetchPowerCloud.php                     # PowerCloud API（新架構，X-API-Key）
│   │   └── User.php                                # 客戶搜尋
│   ├── Domains/
│   │   ├── Email/
│   │   │   ├── Core/SubscriptionEmailHooks.php     # 訂閱生命週期排程發信
│   │   │   ├── DTOs/Email.php                      # Email DTO
│   │   │   ├── Models/SubscriptionEmail.php        # 計算發信時間
│   │   │   └── Services/SubscriptionEmailScheduler.php
│   │   ├── Site/
│   │   │   ├── Core/DisableHooks.php               # 停用/恢復網站排程
│   │   │   └── Services/DisableSiteScheduler.php
│   │   ├── LC/
│   │   │   ├── Core/LifeCycle.php                  # 授權碼 建立/停用/恢復
│   │   │   ├── Core/Api.php                        # 授權碼 REST API
│   │   │   └── Services/ExpireHandler.php          # 延遲停用排程
│   │   └── Settings/Core/WatchSettingHooks.php     # 設定變更時重新排程
│   ├── Product/
│   │   ├── SiteSync.php                            # 首次付款觸發開站
│   │   └── DataTabs/
│   │       ├── LinkedSites.php                     # 商品欄位: host_type, template, plan
│   │       └── LinkedLC.php                        # 商品欄位: 授權碼產品連結
│   └── Utils/
│       ├── Base.php                                # 環境 API 設定、常數
│       └── Token.php                               # ##TOKEN## 替換
├── js/src/
│   ├── main.tsx                                    # React 掛載入口（App1 + App2）
│   ├── App1.tsx                                    # Admin App（無 Shadow DOM）
│   ├── App2.tsx                                    # Frontend App（Shadow DOM）
│   ├── api/                                        # Axios 實例 + CRUD helpers
│   ├── components/                                 # 共用元件
│   ├── hooks/                                      # 共用 hooks
│   ├── pages/AdminApp/                             # Admin Dashboard + Login
│   ├── pages/UserApp/                              # 前台用戶頁面
│   ├── types/                                      # TypeScript 型別
│   └── utils/                                      # 工具函式
├── spec/                                           # 規格文件
└── tests/e2e/                                      # Playwright E2E 測試
```

## 開站流程

```
WooCommerce 訂閱首次付款 (INITIAL_PAYMENT_COMPLETE)
  → SiteSync::site_sync_by_subscription($subscription, $args)
  → 檢查 count($order_ids) === 1（僅父訂單）
  → 遍歷 order items，讀取商品 host_type
  → [powercloud] FetchPowerCloud::site_sync($params, $plan_id, $template_id)
      └── POST api.wpsite.pro/wordpress（X-API-Key 認證）
      └── HTTP 201 → 暫存 email_payloads_tmp
      └── as_schedule_single_action(time()+240, 'powerhouse_delay_send_email')
  → [wpcd] Fetch::site_sync($params)
      └── POST cloud.luke.cafe/wp-json/power-partner-server/site-sync（Basic Auth）
  → 儲存回應到 order item meta + order meta
  → do_action('pp_site_sync_by_subscription')
      └── SubscriptionEmailHooks::schedule_site_sync_email()
  → LC\LifeCycle::create_lcs()（同時觸發）
      └── CloudApi::remote_post('license-codes', ...)
      └── send_email_to_subscriber()
```

## 訂閱狀態對應

| WooCommerce 訂閱狀態變化 | 判定 | 動作 |
|---|---|---|
| Active → Cancelled/On-Hold/Pending-Cancel | **FAILED** | 排程停用網站（N天後）+ 排程停用授權碼（4小時後） |
| Failed → Active | **SUCCESS** | 取消停用排程 + 重新啟用網站 + 恢復授權碼 |
| Active → Expired | **NOT failed** | 自然結束，不觸發停用 |

## Email 系統

### ##TOKEN## 替換

```
##FIRST_NAME## ##LAST_NAME## ##NICE_NAME## ##EMAIL##
##DOMAIN## ##FRONTURL## ##ADMINURL##
##SITEUSERNAME## ##SITEPASSWORD## ##IPV4##
##ORDER_ID## ##ORDER_ITEMS## ##ORDER_STATUS## ##ORDER_DATE##
##CHECKOUT_PAYMENT_URL## ##VIEW_ORDER_URL##
```

### Email action_name 值
- `site_sync` — 開站完成後
- `subscription_failed` / `subscription_success` — 訂閱狀態變更
- `watch_trial_end` / `watch_next_payment` / `watch_end` — 預排程（unique，設定變更時重排）

## 前端架構（雙 App）

```typescript
// main.tsx — 掛載兩個獨立 React App
// App1: 掛載於 #power-partner-connect-app（Admin 管理頁）
// App2: 掛載於 .power_partner_current_user_site_list（前台 shortcode，Shadow DOM）

// 狀態管理: Jotai atoms + TanStack Query v5
// UI: Ant Design 5 + antd-toolkit + Refine
// HTTP: axios（三個實例: WP REST, cloud, powercloud）
```

## 命名慣例

| 類型 | 慣例 | 範例 |
|------|------|------|
| PHP Namespace | PascalCase | `J7\PowerPartner\Domains\Email\Core` |
| PHP 類別 | `final class` + SingletonTrait | `final class SubscriptionEmailHooks` |
| PHP 常數 | UPPER_SNAKE | `LINKED_SITE_IDS_META_KEY` |
| React 元件 | PascalCase | `SiteListTable`, `EmailSetting` |
| Hook | use 前綴 | `useTable`, `useAjax`, `useChangeCustomer` |
| Text Domain | snake_case | `power_partner` |

## 開發規範

1. 所有 PHP 類別使用 `declare(strict_types=1)` + `SingletonTrait`
2. 訂閱 hooks 使用 `J7\Powerhouse\...\Action` enum，不直接使用 WC hooks
3. 日誌使用 `Plugin::logger()`，不使用 `error_log()`
4. API 呼叫: WPCD 用 `Fetch::*`，PowerCloud 用 `FetchPowerCloud::*`
5. Multi-value meta 使用 `ShopSubscription::get_linked_site_ids()`
6. Email 發送: `Token::replace()` → `wpautop()` → `wp_mail()`

## 常用指令

```bash
composer install           # PHP 依賴
pnpm install               # Node 依賴
pnpm dev                   # Vite 開發伺服器
pnpm build:wp              # WordPress 建置
vendor/bin/phpcs            # PHP 代碼檢查
vendor/bin/phpstan analyse  # PHPStan 靜態分析
pnpm release:patch         # 發佈 patch 版本
```
