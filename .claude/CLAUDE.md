# Power Partner — AI Agent 開發指引

**Last Updated:** 2026-03-15
**Plugin Version:** 3.2.5
**Namespace:** `J7\PowerPartner`

---

## 外掛功能

Power Partner 是 WordPress 外掛，讓網站擁有者能以 WooCommerce 訂閱商品形式**銷售 WordPress 網站模板**。客戶購買訂閱後：

1. 自動從模板建立 WordPress 網站（透過 WPCD 舊架構或 PowerCloud 新架構後端）
2. 使用可設定的 HTML Email 模板（`##TOKEN##` 替換格式）將帳密寄給客戶
3. 訂閱失敗時，N 天後自動停用已建立的網站
4. 訂閱恢復時，自動重新啟用網站
5. 同時建立授權碼（Power Shop、Power Course 等）並寄送給客戶

---

## 技術棧

| 層級 | 技術 |
|---|---|
| PHP | PHP >= 8.1, `declare(strict_types=1)` |
| PHP 依賴 | Composer PSR-4（`kucrut/vite-for-wp`, `j7-dev/wp-plugin-trait`） |
| WP 整合 | WooCommerce >= 7.6, Woo Subscriptions >= 5.9, Powerhouse >= 3.3.23 |
| 非同步 | ActionScheduler（WooCommerce 內建） |
| 前端建置 | Vite + `@kucrut/vite-for-wp` |
| 前端框架 | React 18 (TSX), Ant Design 5, Jotai, TanStack Query v5, Refine |
| HTTP | Axios (JS), `wp_remote_*` (PHP) |
| 樣式 | Tailwind CSS, Ant Design CSS-in-JS (`@ant-design/cssinjs`) |
| 代碼品質 | PHPStan, PHPCS (WPCS), ESLint, Prettier |

---

## 專案結構

```
power-partner/
├── plugin.php                      # 外掛入口、版本、必要外掛、啟用 hook
├── inc/classes/
│   ├── Bootstrap.php               # 編排器 singleton — 初始化所有子類別
│   ├── Order.php                   # WC 訂單管理欄位 + metabox
│   ├── ShopSubscription.php        # shop_subscription meta（pp_linked_site_ids）
│   ├── Shortcode.php               # [power_partner_current_user_site_list]
│   ├── Admin/Menu/Setting.php      # 管理頁面 HTML 掛載點
│   ├── Api/
│   │   ├── Main.php                # 核心 REST endpoints
│   │   ├── Connect.php             # partner-id + account-info endpoints
│   │   ├── Fetch.php               # Abstract: WPCD API（舊架構）
│   │   ├── FetchPowerCloud.php     # Abstract: PowerCloud API（新架構）
│   │   └── User.php                # 客戶搜尋 endpoints
│   ├── Compatibility/Compatibility.php
│   ├── Domains/
│   │   ├── Email/
│   │   │   ├── Core/SubscriptionEmailHooks.php    # 訂閱生命週期 → 排程發信
│   │   │   ├── DTOs/Email.php                     # Email DTO（extends DTO base）
│   │   │   ├── Models/EmailBase.php               # Email 基礎模型
│   │   │   ├── Models/SubscriptionEmail.php       # 計算寄信時間戳
│   │   │   ├── Services/SubscriptionEmailScheduler.php  # ActionScheduler 包裝
│   │   │   └── Shared/Enums/                      # Enabled, Operator 列舉
│   │   ├── Site/
│   │   │   ├── Core/DisableHooks.php              # 訂閱失敗 → 停用/恢復網站
│   │   │   └── Services/DisableSiteScheduler.php
│   │   ├── LC/
│   │   │   ├── Core/LifeCycle.php                 # 授權碼 建立/停用/恢復
│   │   │   ├── Core/Api.php                       # 授權碼 REST API
│   │   │   ├── Core/Deprecated.php                # 棄用方法
│   │   │   └── Services/ExpireHandler.php         # 延遲停用排程
│   │   ├── Settings/Core/WatchSettingHooks.php    # 設定變更時重新排程
│   │   └── Subscription/Utils/Base.php            # 訂閱工具方法
│   ├── Product/
│   │   ├── SiteSync.php            # INITIAL_PAYMENT_COMPLETE 觸發開站
│   │   └── DataTabs/
│   │       ├── LinkedSites.php     # 商品欄位: host_type, template, plan
│   │       └── LinkedLC.php        # 商品欄位: linked license products
│   ├── Test/Retry.php              # 測試工具（僅 local 環境載入）
│   └── Utils/
│       ├── Base.php                # 環境 API 設定、常數、mail_to
│       └── Token.php               # ##TOKEN## 替換
├── js/src/
│   ├── main.tsx                    # 入口: 掛載 App1 (admin) + App2 (frontend)
│   ├── App1.tsx                    # Admin: Ant Design, 無 Shadow DOM
│   ├── App2.tsx                    # Frontend: Shadow DOM via react-shadow
│   ├── api/                        # Axios 實例 + CRUD resource helpers
│   ├── hooks/                      # useTable, useOne, useAjax, useModal, useUpdate
│   ├── components/                 # 共用元件（SiteListTable, LicenseCodes, etc.）
│   ├── pages/AdminApp/             # Dashboard tabs + Login
│   ├── pages/UserApp/              # 客戶網站列表 + 授權碼
│   ├── types/                      # TypeScript 型別定義
│   └── utils/                      # 工具函式、常數
├── spec/                           # 規格文件（features, activities, entity, api）
├── tests/e2e/                      # Playwright E2E 測試
├── release/                        # release-it 設定和腳本
└── stubs/                          # PHP stubs
```

---

## PHP 架構規則

### 嚴格型別
```php
declare(strict_types=1);
```

### Singleton 模式（所有 hook 註冊類別）
```php
final class MyClass {
    use \J7\WpUtils\Traits\SingletonTrait;
    public function __construct() {
        // 在此註冊 hooks
    }
}
// 初始化: MyClass::instance();
// 禁止: new MyClass()
```

### 日誌 — 使用 Plugin::logger()，禁用 error_log()
```php
Plugin::logger('message', 'error', ['context' => $value], $limit);
// Levels: 'info' | 'warning' | 'error' | 'critical' | 'debug'
// $limit: 最大存儲行數（0 = 無限）
```

### 訂閱生命週期 hooks — 使用 Action enum
```php
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;

// 正確:
\add_action(Action::INITIAL_PAYMENT_COMPLETE->get_action_hook(), [$this, 'cb'], 10, 2);
\add_action(Action::SUBSCRIPTION_FAILED->get_action_hook(), [$this, 'cb'], 10, 2);
\add_action(Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [$this, 'cb'], 10, 2);

// 禁止直接使用 WooCommerce 原生 hooks:
// \add_action('woocommerce_subscription_pre_update_status', ...);
```

### 訂閱「失敗」定義
> Active → Cancelled / On-Hold / Pending-Cancel = **FAILED**（觸發停用排程）
> Active → Expired = **NOT failed**（自然結束，不停用）

### 非同步延遲工作 — ActionScheduler
```php
\as_schedule_single_action($timestamp, 'my_hook', $args);   // 延遲
\as_enqueue_async_action('my_hook', $args);                 // 背景立即
\as_unschedule_all_actions('my_hook');                      // 取消
```

---

## 雙主機後端

| `host_type` 值 | 類別 | API base | 認證 |
|---|---|---|---|
| `powercloud` *（預設）* | `Api\FetchPowerCloud` | `https://api.wpsite.pro` | `X-API-Key` header |
| `wpcd` | `Api\Fetch` | `https://cloud.luke.cafe` | HTTP Basic Auth |

PowerCloud API key 儲存方式:
- 全域: transient `power_partner_powercloud_api_key`（無 TTL）
- Per-user 舊版: transient `power_partner_powercloud_api_key_{user_id}`（無 TTL）
- `FetchPowerCloud::get_powercloud_api_key()` 優先使用全域 key，fallback 到 per-user key

---

## WordPress Options

| Key | Type | Description |
|---|---|---|
| `power_partner_settings` | array | `{power_partner_disable_site_after_n_days: int, emails: Email[]}` |
| `power_partner_partner_id` | string | cloud.luke.cafe 的 Partner ID |
| `power_partner_account_info` | string | 加密帳號資訊 |

## WordPress Transients

| Key | TTL | Description |
|---|---|---|
| `power_partner_allowed_template_options` | 7 天 | WPCD 模板列表 `{id: title}` |
| `power_partner_allowed_template_options_powercloud` | 7 天 | PowerCloud 模板列表 `{id: domain}` |
| `power_partner_open_site_plan_options_powercloud` | 7 天 | PowerCloud 方案列表 `{id: name-price}` |
| `power_partner_powercloud_api_key` | 永久 | 全域 PowerCloud API key |
| `power_partner_powercloud_api_key_{user_id}` | 永久 | Per-user PowerCloud API key（舊版） |

## Post Meta

| Key | Post type | Notes |
|---|---|---|
| `pp_linked_site_ids` | `shop_subscription` | **Multi-value** — 使用 `ShopSubscription::get_linked_site_ids()` |
| `pp_create_site_responses` | `shop_order` | JSON: 開站 API 回應 |
| `_pp_create_site_responses_item` | order item | JSON: 逐項開站回應 |
| `is_power_partner_site_sync` | `shop_subscription` | `'1'` 標記為 PP 訂閱 |
| `lc_id` | `shop_subscription` | Multi-value: 授權碼 IDs |
| `email_payloads_tmp` | `shop_subscription` | 暫存: 延遲發信後刪除 |
| `power_partner_host_type` | product/variation | `'powercloud'` 或 `'wpcd'` |
| `power_partner_host_position` | product/variation | 區域: `jp`, `tw`, `us_west`, `uk_london`, `sg`, `hk`, `canada` |
| `power_partner_linked_site` | product/variation | 模板站 ID |
| `power_partner_open_site_plan` | product/variation | PowerCloud 方案 ID |

---

## REST API Routes

**Namespace:** `power-partner` → `/wp-json/power-partner/`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/customer-notification` | IP whitelist | WPCD 回調：寄信通知客戶帳密 |
| POST | `/link-site` | IP whitelist | 綁定 site ID 到訂閱 |
| POST | `/manual-site-sync` | `manage_options` | 手動開站 |
| POST | `/clear-template-sites-cache` | `manage_options` | 清除模板/方案 transients |
| POST | `/send-site-credentials-email` | `manage_options` | 手動寄送帳密 Email |
| GET | `/emails` | `manage_options` | 取得 Email 模板 |
| POST | `/emails` | `manage_options` | 儲存 Email 模板 *(deprecated → 用 /settings)* |
| GET | `/subscriptions` | `manage_options` | 列出用戶的訂閱 |
| POST | `/change-subscription` | `manage_options` | 重新綁定 site IDs |
| GET | `/apps` | public | 查詢 site IDs 對應的訂閱 |
| POST | `/settings` | `manage_options` | 儲存 `power_partner_settings` |
| POST | `/powercloud-api-key` | `manage_options` | 儲存 PowerCloud API key |
| GET | `/partner-id` | public | 取得 partner ID |
| POST | `/partner-id` | `manage_options` | 設定 partner ID + 更新模板快取 |
| DELETE | `/partner-id` | `manage_options` | 移除 partner ID + 清除快取 |
| GET | `/account-info` | public | 取得加密帳號資訊 |
| GET | `/customers-by-search` | `manage_options` | 搜尋用戶 |
| GET | `/customers` | public | 以 ID 陣列查詢用戶 |

**IP Whitelist** (`/customer-notification`, `/link-site`):
- 固定: `103.153.176.121`, `199.99.88.1`, `163.61.60.80`
- 私有範圍: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- 舊版範圍: `61.220.44.0-61.220.44.10`
- `local` / `staging` 環境跳過檢查

---

## 自訂 Actions

| Action | Args | 時機 |
|---|---|---|
| `pp_site_sync_by_subscription` | `$subscription` | 開站成功後（所有後端） |
| `pp_after_site_sync` | `$response_obj` | WPCD API 回應後 |
| `pp_after_site_sync_powercloud` | `$response_obj, $props` | PowerCloud API 回應後 |

---

## Email 系統

### Email DTO 欄位
```php
string $key;          // 唯一 key（前端 render 用）
string $enabled;      // '1' 或 '0'
string $subject;      // 支援 ##TOKEN##
string $body;         // HTML，支援 ##TOKEN##
string $action_name;  // 'site_sync' | Action enum value
string $days;         // 數字偏移量
string $operator;     // 'before' | 'after'
bool   $unique;       // trial_end/next_payment/end 自動為 true
```

### action_name 值
| 值 | 發送時機 |
|---|---|
| `site_sync` | 開站完成後 |
| `subscription_failed` | 訂閱 active → cancelled/on-hold |
| `subscription_success` | 訂閱 failed → active |
| `trial_end` | 試用結束時 |
| `next_payment` | 下次付款時 |
| `end` | 訂閱結束時 |
| `watch_trial_end` | 試用結束前/後 N 天（unique，設定變更時重新排程） |
| `watch_next_payment` | 下次付款前/後 N 天（unique） |
| `watch_end` | 訂閱結束前/後 N 天（unique） |

### 支援的 ##TOKEN## 值
`##FIRST_NAME##` `##LAST_NAME##` `##NICE_NAME##` `##EMAIL##`
`##DOMAIN##` `##FRONTURL##` `##ADMINURL##`
`##SITEUSERNAME##` `##SITEPASSWORD##` `##IPV4##`
`##ORDER_ID##` `##ORDER_ITEMS##` `##ORDER_STATUS##` `##ORDER_DATE##`
`##CHECKOUT_PAYMENT_URL##` `##VIEW_ORDER_URL##`

---

## 前端架構

### 雙 App 掛載

| App | Selector | 位置 | Shadow DOM |
|---|---|---|---|
| App1 | `#power-partner-connect-app` | Admin 管理頁 | 否 |
| App2 | `.power_partner_current_user_site_list` | 前台（shortcode） | **是** |

### Admin Dashboard tabs

| Tab | Component | 說明 |
|---|---|---|
| 所有站台 | `SiteList` | 已建站列表 |
| 點數 Log | `LogList` | cloud.luke.cafe 點數紀錄 |
| Email 設定 | `EmailSetting` | Email 模板管理 |
| 手動開站 | `ManualSiteSync` | 手動建站 |
| 設定 | `Settings` | 外掛設定 |
| 授權碼管理 | `LicenseCodes` | 授權碼管理 |
| 其他資訊 | `Description` | 說明/文件連結 |
| 新架構權限 | `PowercloudAuth` | 設定 PowerCloud API key |

### JS localized window object: `window.power_partner_data.env`
```ts
{
  siteUrl, ajaxUrl, userId, postId, permalink,
  APP_NAME, KEBAB, SNAKE,
  BASE_URL,           // '/'
  APP1_SELECTOR,      // '#power-partner-connect-app'
  APP2_SELECTOR,      // '.power_partner_current_user_site_list'
  API_TIMEOUT,        // '30000'
  nonce,              // WP REST nonce
  allowed_template_options,   // {id: title}
  partner_id,
  disable_site_after_n_days,
  t,                  // base64 Basic Auth token
  cloudBaseUrl,       // cloud.luke.cafe base URL
  POWERCLOUD_API,     // api.wpsite.pro base URL
  is_kiwissec,        // bool
  myAccountUrl,
}
```

### 狀態管理
- **Jotai** atoms: `identityAtom`, `globalLoadingAtom`, `tabAtom`, `powercloudAtom`
- **TanStack Query v5** 管理伺服器狀態

---

## 新增功能指引

### 新 PHP singleton 類別
1. 在正確的 `inc/classes/` 子目錄建立，設定正確 namespace
2. 加上 `declare(strict_types=1)` + `use SingletonTrait`
3. 在 `__construct()` 註冊 hooks
4. 在 `Bootstrap::__construct()` 加入 `MyClass::instance();`

### 新 REST endpoint
1. 在對應的 `Api\*::register_apis()` 中呼叫 `\register_rest_route()`
2. Admin routes: `'permission_callback' => fn() => current_user_can('manage_options')`
3. Server callbacks: `'permission_callback' => [$this, 'check_ip_permission']`

### 新商品 meta 欄位
1. 在 `LinkedSites` 或 `LinkedLC` 加入 `const FIELD_NAME`
2. 在 `custom_field_subscription()` 和 `custom_field_variable_subscription()` 加入渲染
3. 在 `save_subscription()` 和 `save_variable_subscription()` 加入儲存

### 新 Email action type
1. 使用 Powerhouse 的 `Action` enum 值
2. 在 `SubscriptionEmailHooks::__construct()` 連接 hook
3. 如果是 unique/可重排程的 action，加入 `$mapper`
4. 如果需要設定變更時重排程，加入 `WatchSettingHooks::is_in_schedule_actions()`

---

## 常見陷阱

1. **Multi-value meta** — `pp_linked_site_ids` 每個訂閱有多行。永遠使用 `ShopSubscription::get_linked_site_ids()`，不要用 `get_post_meta($id, 'pp_linked_site_ids', true)`。

2. **PowerCloud 需要 API key** — 如果 transient 不存在，`FetchPowerCloud::site_sync()` 會拋出異常。管理員必須先在**新架構權限** tab 認證。

3. **模板選項快取 7 天** — 在商品編輯器使用「清除快取」按鈕或呼叫 `POST /clear-template-sites-cache`。

4. **Email 順序** — `Token::replace()` 在 `wpautop()` 之前執行，不可反轉順序。

5. **僅首次付款觸發開站** — `SiteSync::site_sync_by_subscription()` 檢查 `count($order_ids) === 1`（僅父訂單）。續訂**不會**觸發新建站。

6. **v2→v3 相容代碼** — `Bootstrap::compatibility_settings()` 標記 `@deprecated v4`，下個大版本刪除。

7. **ActionScheduler 註冊順序** — Scheduler `::register()` 必須在任何可能觸發排程的 action 之前呼叫（Bootstrap 中已正確設定，不要重排）。

8. **PowerCloud 開站回應 201** — 成功回應碼是 HTTP 201（非 200），`SiteSync::site_sync_powercloud()` 依此判斷是否發送 Email。

9. **延遲寄信 4 分鐘** — PowerCloud 開站後透過 `as_schedule_single_action(time() + 240, ...)` 延遲 4 分鐘發送帳密 Email，暫存資料在 `email_payloads_tmp` meta。

10. **Connect.php 底部有 `new Connect()`** — 這是舊代碼，Connect 類別同時使用 SingletonTrait 和底部 `new Connect()` 初始化。
