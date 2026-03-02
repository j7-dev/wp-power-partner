# Power Partner — Copilot Instructions
#
# This file belongs at: .github/copilot-instructions.md
# To install: mkdir .github && move copilot-instructions.md .github\
#             (or run setup-docs.ps1 first, then re-run the doc generation)

# Power Partner — GitHub Copilot Instructions

**Last Updated:** 2025-01-01
**Plugin Version:** 3.2.4
**Namespace:** `J7\PowerPartner`

---

## What This Plugin Does

Power Partner is a WordPress plugin that enables any site owner to **sell WordPress website templates as WooCommerce subscription products**. When a customer purchases a subscription:

1. The plugin automatically provisions a WordPress site from a template (via WPCD or PowerCloud backend).
2. Credentials are emailed to the customer using configurable HTML email templates with token substitution (`##TOKEN##` format).
3. If the subscription fails, the provisioned site is automatically suspended (after N configurable days).
4. If the subscription recovers, the site is automatically re-enabled.
5. License codes (for plugins like Power Shop, Power Course) are also created and emailed at subscription creation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| PHP runtime | PHP ≥ 8.1, strict types everywhere |
| PHP dependencies | Composer, PSR-4 autoload |
| WP integration | WooCommerce ≥ 7.6, Woo Subscriptions ≥ 5.9, Powerhouse ≥ 3.3.23 |
| Async jobs | ActionScheduler (bundled with WooCommerce) |
| Frontend build | Vite + `@kucrut/vite-for-wp` (dev port 5176) |
| Frontend framework | React 18 (TSX), Ant Design, Jotai (atoms), TanStack Query v5 |
| HTTP client | Axios (JS → WP REST), WP `wp_remote_*` (PHP → external APIs) |
| Styling | Tailwind CSS, Ant Design CSS-in-JS (`@ant-design/cssinjs`) |
| Code quality | PHPStan, PHPCS (WPCS), ESLint, Prettier |

---

## Project Layout

```
power-partner/
├── plugin.php                      # Plugin header, version, required plugins, activate hook
├── inc/classes/
│   ├── Bootstrap.php               # Orchestrator singleton — initialises all other classes
│   ├── Order.php                   # WC order admin columns + metabox (site-sync status)
│   ├── ShopSubscription.php        # shop_subscription meta helpers (pp_linked_site_ids)
│   ├── Shortcode.php               # [power_partner_current_user_site_list]
│   ├── Admin/Menu/Setting.php      # Renders admin page HTML mount point
│   ├── Api/
│   │   ├── Main.php                # Most REST endpoints
│   │   ├── Connect.php             # partner-id + account-info endpoints
│   │   ├── Fetch.php               # Abstract: WPCD API (legacy hosting)
│   │   ├── FetchPowerCloud.php     # Abstract: PowerCloud API (new hosting)
│   │   └── User.php                # Customer search endpoints
│   ├── Compatibility/Compatibility.php
│   ├── Domains/
│   │   ├── Email/Core/SubscriptionEmailHooks.php   # Lifecycle → email scheduling
│   │   ├── Email/DTOs/Email.php                    # Email DTO
│   │   ├── Email/Models/SubscriptionEmail.php       # Resolves send timestamp
│   │   ├── Email/Services/SubscriptionEmailScheduler.php
│   │   ├── Site/Core/DisableHooks.php              # Lifecycle → site disable/enable
│   │   ├── Site/Services/DisableSiteScheduler.php
│   │   ├── LC/Core/LifeCycle.php                   # License code create/expire/recover
│   │   ├── LC/Core/Api.php
│   │   └── Settings/Core/WatchSettingHooks.php      # Reschedules on settings change
│   ├── Product/SiteSync.php        # Triggers provisioning on INITIAL_PAYMENT_COMPLETE
│   ├── Product/DataTabs/LinkedSites.php  # Product fields: host_type, template, plan
│   ├── Product/DataTabs/LinkedLC.php     # Product fields: linked license products
│   └── Utils/
│       ├── Base.php                # Env-based API auth config, constants, mail_to
│       └── Token.php               # ##TOKEN## replacement
├── js/src/
│   ├── main.tsx                    # Entry: mounts App1 (admin) + App2 (frontend)
│   ├── App1.tsx                    # Admin: Ant Design, no Shadow DOM
│   ├── App2.tsx                    # Frontend: Shadow DOM via react-shadow
│   ├── api/                        # Axios instances + CRUD resource helpers
│   ├── hooks/                      # useTable, useOne, useAjax, useModal, useUpdate
│   ├── pages/AdminApp/             # Dashboard tabs + Login
│   └── pages/UserApp/              # Customer site list + license codes
```

---

## PHP Architecture Rules

### Always use strict types
```php
declare(strict_types=1);
```

### Singleton pattern for all hook-registering classes
```php
final class MyClass {
    use \J7\WpUtils\Traits\SingletonTrait;
    public function __construct() {
        // register hooks here
    }
}
// Initialise: MyClass::instance();
// NEVER: new MyClass()
```

### Logging — use Plugin::logger(), never error_log()
```php
Plugin::logger('message', 'error', ['context' => $value], $limit);
// Levels: 'info' | 'warning' | 'error' | 'critical'
// $limit: max stored log lines (0 = unlimited)
```

### Subscription lifecycle hooks — use Action enum
```php
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;

// CORRECT:
\add_action(Action::INITIAL_PAYMENT_COMPLETE->get_action_hook(), [$this, 'cb'], 10, 2);
\add_action(Action::SUBSCRIPTION_FAILED->get_action_hook(), [$this, 'cb'], 10, 2);
\add_action(Action::SUBSCRIPTION_SUCCESS->get_action_hook(), [$this, 'cb'], 10, 2);

// WRONG — never do this:
// \add_action('woocommerce_subscription_pre_update_status', ...);
// \add_action('transition_post_status', ...);
```

### Subscription "failure" definition
> Active → Cancelled / On-Hold / Pending-Cancel = **FAILED** (triggers site disable)
> Active → Expired = **NOT failed** (natural end, no disable)

### Async deferred work — ActionScheduler
```php
\as_schedule_single_action($timestamp, 'my_hook', $args);   // future
\as_enqueue_async_action('my_hook', $args);                 // ASAP background
\as_unschedule_all_actions('my_hook');                      // cancel
```

---

## Dual Hosting Backend

| `host_type` value | Class | API base | Auth |
|---|---|---|---|
| `powercloud` *(default)* | `Api\FetchPowerCloud` | `https://api.wpsite.pro` | `X-API-Key` header (per-user transient) |
| `wpcd` | `Api\Fetch` | `https://cloud.luke.cafe` | HTTP Basic Auth |

PowerCloud API key is stored in transient `power_partner_powercloud_api_key_{user_id}` (30 days TTL).

---

## WordPress Options

| Key | Type | Description |
|---|---|---|
| `power_partner_settings` | array | `{power_partner_disable_site_after_n_days: int, emails: Email[]}` |
| `power_partner_partner_id` | string | Partner ID on cloud.luke.cafe |
| `power_partner_account_info` | string | Encrypted account info |

## WordPress Transients

| Key | TTL | Description |
|---|---|---|
| `power_partner_allowed_template_options` | 7 days | WPCD template list `{id: title}` |
| `power_partner_allowed_template_options_powercloud` | 7 days | PowerCloud template list `{id: domain}` |
| `power_partner_open_site_plan_options_powercloud` | 7 days | PowerCloud plan list `{id: name-price}` |
| `power_partner_powercloud_api_key_{user_id}` | 30 days | PowerCloud API key per admin user |

## Post Meta

| Key | Post type | Notes |
|---|---|---|
| `pp_linked_site_ids` | `shop_subscription` | **Multi-value** — use `ShopSubscription::get_linked_site_ids()` |
| `pp_create_site_responses` | `shop_order` | JSON: API response from provisioning |
| `_pp_create_site_responses_item` | order item | JSON: per-item provisioning response |
| `is_power_partner_site_sync` | `shop_subscription` | `'1'` flags as PP subscription |
| `lc_id` | `shop_subscription` | Multi-value: license code IDs |
| `email_payloads_tmp` | `shop_subscription` | Temp: deleted after delayed email fires |
| `power_partner_host_type` | product/variation | `'powercloud'` or `'wpcd'` |
| `power_partner_host_position` | product/variation | Region: `jp`, `tw`, `us_west`, etc. |
| `power_partner_linked_site` | product/variation | Template site ID |
| `power_partner_open_site_plan` | product/variation | PowerCloud plan ID |

---

## REST API Routes

**Namespace:** `power-partner` → `/wp-json/power-partner/`

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/customer-notification` | IP whitelist | Email customer credentials (WPCD callback) |
| POST | `/link-site` | IP whitelist | Link a site ID to a subscription |
| POST | `/manual-site-sync` | `manage_options` | Manually provision a site |
| POST | `/clear-template-sites-cache` | `manage_options` | Clear template/plan transients |
| POST | `/send-site-credentials-email` | `manage_options` | Send credentials email (manual) |
| GET  | `/emails` | `manage_options` | Get saved email templates |
| POST | `/emails` | `manage_options` | Save email templates *(deprecated → use /settings)* |
| GET  | `/subscriptions` | `manage_options` | List subscriptions for a user |
| POST | `/change-subscription` | `manage_options` | Reassign site IDs to a subscription |
| GET  | `/apps` | public | Get subscription IDs for site IDs |
| POST | `/settings` | `manage_options` | Save `power_partner_settings` |
| POST | `/powercloud-api-key` | `manage_options` | Store PowerCloud API key to transient |
| GET  | `/partner-id` | public | Get stored partner ID |
| POST | `/partner-id` | `manage_options` | Set partner ID + update template cache |
| DELETE | `/partner-id` | `manage_options` | Remove partner ID + clear cache |
| GET  | `/account-info` | public | Get encrypted account info |
| GET  | `/customers-by-search` | `manage_options` | Search users by ID or keyword |
| GET  | `/customers` | public | Get users by ID array |

**IP Whitelist** (for `/customer-notification`, `/link-site`):
- Fixed: `103.153.176.121`, `199.99.88.1`, `163.61.60.80`
- Private ranges: `10.x.x.x`, `172.16-31.x.x`, `192.168.x.x`
- `local` / `staging` environments bypass check entirely

---

## Custom Actions Fired by This Plugin

| Action | Args | When |
|---|---|---|
| `pp_site_sync_by_subscription` | `$subscription` | After successful provisioning (all backends) |
| `pp_after_site_sync` | `$response_obj` | After WPCD API response |
| `pp_after_site_sync_powercloud` | `$response_obj, $props` | After PowerCloud API response |

---

## Email System

### Email DTO fields
```php
string $key;          // unique key (used in frontend)
string $enabled;      // '1' or '0'
string $subject;      // supports ##TOKEN##
string $body;         // HTML, supports ##TOKEN##
string $action_name;  // 'site_sync' | Action enum value
string $days;         // numeric offset from trigger
string $operator;     // 'before' | 'after'
bool   $unique;       // auto-true for trial_end/next_payment/end (reschedule-able)
```

### action_name values
| Value | When sent |
|---|---|
| `site_sync` | Right after site is provisioned |
| `subscription_failed` | subscription active → cancelled/on-hold |
| `subscription_success` | subscription failed → active |
| `trial_end` | At trial end |
| `next_payment` | At next payment |
| `end` | At subscription end |
| `watch_trial_end` | N days before/after trial end (unique, re-scheduled on settings save) |
| `watch_next_payment` | N days before/after next payment (unique) |
| `watch_end` | N days before/after subscription end (unique) |

### Supported ##TOKEN## values
`##FIRST_NAME##` `##LAST_NAME##` `##NICE_NAME##` `##EMAIL##`
`##DOMAIN##` `##FRONTURL##` `##ADMINURL##`
`##SITEUSERNAME##` `##SITEPASSWORD##` `##IPV4##`
`##ORDER_ID##` `##ORDER_ITEMS##` `##ORDER_STATUS##` `##ORDER_DATE##`
`##CHECKOUT_PAYMENT_URL##` `##VIEW_ORDER_URL##`

---

## Frontend Architecture

### Two mounted apps

| App | Selector | Location | Shadow DOM |
|---|---|---|---|
| App1 | `#power-partner-connect-app` | Admin page | No |
| App2 | `.power_partner_current_user_site_list` | Frontend (shortcode) | **Yes** |

### Admin Dashboard tabs

| Tab | Component | Description |
|---|---|---|
| 所有站台 | `SiteList` | All provisioned sites |
| 點數 Log | `LogList` | Credit log from cloud.luke.cafe |
| Email 設定 | `EmailSetting` | Manage email templates |
| 手動開站 | `ManualSiteSync` | Manual site provisioning |
| 設定 | `Settings` | Plugin settings |
| 授權碼管理 | `LicenseCodes` | License code management |
| 其他資訊 | `Description` | Help / docs links |
| 新架構權限 | `PowercloudAuth` | Set PowerCloud API key |

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

### State management
- **Jotai** atoms: `identityAtom`, `globalLoadingAtom`, `tabAtom`
- **TanStack Query v5** for server state

---

## Adding New Features

### New PHP singleton class
1. Create in correct `inc/classes/` subdirectory with proper namespace
2. Add `declare(strict_types=1)` + `use SingletonTrait`
3. Register hooks in `__construct()`
4. Add `MyClass::instance();` in `Bootstrap::__construct()`

### New REST endpoint
1. Call `\register_rest_route()` in appropriate `Api\*::register_apis()`
2. Gate admin routes: `'permission_callback' => fn() => current_user_can('manage_options')`
3. Gate server callbacks: `'permission_callback' => [$this, 'check_ip_permission']`

### New product meta field
1. Add `const FIELD_NAME` to `LinkedSites` or `LinkedLC`
2. Add render logic in `custom_field_subscription()` and `custom_field_variable_subscription()`
3. Add save logic in `save_subscription()` and `save_variable_subscription()`

### New email action type
1. Add/reuse `Action` enum value from Powerhouse
2. Wire hook in `SubscriptionEmailHooks::__construct()`
3. Add to `$mapper` if it's a unique/re-schedulable action
4. Add to `WatchSettingHooks::is_in_schedule_actions()` if reschedule-on-save is needed

---

## Common Pitfalls

1. **Multi-value meta** — `pp_linked_site_ids` has multiple rows per subscription. Always use `ShopSubscription::get_linked_site_ids()`, never `get_post_meta($id, 'pp_linked_site_ids', true)`.

2. **PowerCloud needs per-user API key** — If `power_partner_powercloud_api_key_{user_id}` transient is missing, `FetchPowerCloud::site_sync()` throws. The user must authenticate via the **新架構權限** tab first.

3. **Template options are cached 7 days** — Use the "清除快取" button in the product editor or call `POST /clear-template-sites-cache` after the admin adds new templates to cloud.

4. **Email ordering** — `Token::replace()` runs before `wpautop()`. Don't reverse this order.

5. **Only initial payment triggers provisioning** — `SiteSync::site_sync_by_subscription()` checks `count($order_ids) === 1` (parent order only). Renewal orders do **not** trigger new site creation.

6. **v2→v3 compat code** — `Bootstrap::compatibility_settings()` is marked `@deprecated v4`. Delete it in the next major version.

7. **ActionScheduler registration order** — Scheduler `::register()` calls in Bootstrap must come before any action that could trigger scheduling (already set up correctly; don't reorder).
