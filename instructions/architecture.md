# Power Partner — Architecture Guide
#
# This file belongs at: instructions/architecture.md
# Run setup-docs.ps1 to create the instructions/ directory, then move this file there.

# Power Partner — Architecture & Domain Model

**Last Updated:** 2025-01-01

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PARTNER'S WORDPRESS SITE                    │
│                                                                  │
│  WooCommerce Subscription ──────────────────────────────────┐   │
│  (customer purchases)                                        │   │
│                                                              ▼   │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │   │
│  │  SiteSync    │    │  DisableHooks│    │  LC\LifeCycle │  │   │
│  │  (provision) │    │  (suspend)   │    │  (lic codes)  │  │   │
│  └──────┬───────┘    └──────┬───────┘    └───────┬───────┘  │   │
│         │                   │                    │           │   │
│         ▼                   ▼                    ▼           │   │
│  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │   │
│  │  Fetch       │    │  ActionSched │    │  Powerhouse   │  │   │
│  │  FetchPC     │    │  (async)     │    │  CloudApi     │  │   │
│  └──────┬───────┘    └──────────────┘    └───────┬───────┘  │   │
└─────────┼────────────────────────────────────────┼──────────┘
          │                                         │
          ▼                                         ▼
┌──────────────────────┐              ┌───────────────────────┐
│  cloud.luke.cafe     │              │  api.wpsite.pro        │
│  (WPCD / legacy)     │              │  (PowerCloud / new)    │
│  + license codes     │              │                        │
└──────────────────────┘              └───────────────────────┘
```

---

## Subscription Lifecycle & Hook Mapping

```
Customer buys subscription
         │
         ▼
  INITIAL_PAYMENT_COMPLETE ──────┬──── SiteSync::site_sync_by_subscription()
                                  │         └── [powercloud] FetchPowerCloud::site_sync()
                                  │         └── [wpcd]       Fetch::site_sync()
                                  │         └── do_action('pp_site_sync_by_subscription')
                                  │                 └── SubscriptionEmailHooks::schedule_site_sync_email()
                                  │
                                  └──── LC\LifeCycle::create_lcs()
                                             └── Creates license codes via CloudApi
                                             └── Sends license code email

         │
         │  (time passes...)
         │
  SUBSCRIPTION_FAILED ────────────┬──── DisableHooks::schedule_disable_site()
                                   │         └── DisableSiteScheduler::schedule_single(now + N days)
                                   │
                                   └──── LC\LifeCycle::subscription_failed()
                                             └── ExpireHandler::schedule_single(now + 4h)
                                   │
                                   └──── SubscriptionEmailHooks (fires subscription_failed emails)

         │
         │  (N days later via ActionScheduler)
         │
  [ASYNC] disable_site_hook ──────────── FetchPowerCloud::disable_site() OR Fetch::disable_site()

         │
         │  (customer pays, subscription recovers)
         │
  SUBSCRIPTION_SUCCESS ───────────┬──── DisableHooks::cancel_disable_site_schedule()
                                   ├──── DisableHooks::restart_all_stopped_sites_scheduler()
                                   │         └── Fetch::enable_site() or FetchPowerCloud::enable_site()
                                   └──── LC\LifeCycle::subscription_success()
                                             └── ExpireHandler::unschedule()
                                             └── CloudApi: license-codes/recover
```

---

## Domain Modules

### `Domains\Email`
Manages all outbound email scheduling and delivery.

- **`Core\SubscriptionEmailHooks`** — Singleton. Wires every `Action` enum hook to schedule emails. Reads email templates from `power_partner_settings['emails']`.
- **`DTOs\Email`** — Value object for an email template. Immutable after construction. Validates `action_name`, `operator`, `days`.
- **`Models\SubscriptionEmail`** — Combines Email DTO + Subscription to compute the final send timestamp.
- **`Services\SubscriptionEmailScheduler`** — Thin wrapper around ActionScheduler. `register()` must be called in Bootstrap.

### `Domains\Site`
Manages site suspend/resume scheduling.

- **`Core\DisableHooks`** — Singleton. Listens for `SUBSCRIPTION_FAILED` → schedules disable; `SUBSCRIPTION_SUCCESS` → cancels + re-enables.
- **`Services\DisableSiteScheduler`** — ActionScheduler wrapper. Args include `{subscription_id}`.

### `Domains\LC` (License Codes)
Manages license code lifecycle via `cloud.luke.cafe` API.

- **`Core\LifeCycle`** — Creates LCs on `INITIAL_PAYMENT_COMPLETE`; expires on `SUBSCRIPTION_FAILED`; recovers on `SUBSCRIPTION_SUCCESS`.
- **`Core\Api`** — REST endpoints for LC management (admin).
- **`Services\ExpireHandler`** — ActionScheduler wrapper for deferred LC expiry.

### `Domains\Settings`
Watches for settings changes and reschedules dependent async jobs.

- **`Core\WatchSettingHooks`** — On `update_option_power_partner_settings`, reschedules: (a) all pending `disable_site` actions if the N-days value changed, (b) all lifecycle emails if email timing changed.

---

## API Layer

### `Api\Fetch` (WPCD / legacy)
Abstract class. Communicates with `cloud.luke.cafe` via HTTP Basic Auth.

Key methods:
- `site_sync(array $props)` — POST to `/wp-json/power-partner-server/site-sync`
- `disable_site(string $site_id)` — POST to `.../v2/disable-site`
- `enable_site(string $site_id)` — POST to `.../v2/enable-site`
- `get_allowed_template_options()` — Fetches + caches template list (7-day transient)

### `Api\FetchPowerCloud` (new architecture)
Abstract class. Communicates with `api.wpsite.pro` via `X-API-Key` header.

Key methods:
- `site_sync(array $props, string $plan_id, string $template_id)` — POST to `/wordpress`
- `disable_site(string $user_id, string $websiteId)` — PATCH to `/wordpress/{id}/stop`
- `enable_site(string $user_id, string $websiteId)` — PATCH to `/wordpress/{id}/start`
- `get_allowed_template_options()` — GET `/templates/wordpress`
- `get_open_site_plan_options()` — GET `/website-packages`

### `Api\Main` — Core REST routes
Registered on `rest_api_init`. Contains the most endpoints (see REST API reference).

### `Api\Connect` — Partner connection
- `GET/POST/DELETE /partner-id` — Manage partner connection state
- `GET /account-info` — Retrieve stored account info

### `Api\User` — Customer data
- `GET /customers-by-search` — Search by ID or keyword
- `GET /customers` — Fetch by ID array

---

## Product Configuration (DataTabs)

### `Product\DataTabs\LinkedSites`
Adds custom fields to WooCommerce product editor (General tab) for subscription products and variations.

Fields:
- `power_partner_host_type` — `powercloud` (new) or `wpcd` (legacy)
- `power_partner_host_position` — Server region
- `power_partner_linked_site` — Template site ID (different lists per host_type)
- `power_partner_open_site_plan` — PowerCloud plan ID

The UI uses a tab widget (新架構 / 舊架構) to switch between the two host types. JS inline script handles tab switching and disables inactive tab's hidden inputs before form submit.

### `Product\DataTabs\LinkedLC`
Adds custom fields for linking WooCommerce subscription products to license code products on cloud.luke.cafe.

---

## Frontend Apps

### App1 — Admin Page
- Entry: `pages/AdminApp/index.tsx`
- Auth check: `useGetUserIdentity()` → shows `Login` or `Dashboard`
- Dashboard wraps all tabs in an Ant Design `Form` for batch save (Email + Settings tabs)
- Global save button only visible on Email and Settings tabs
- Tab state managed via `tabAtom` (Jotai)

### App2 — Frontend (Shortcode)
- Entry: `pages/UserApp/index.tsx`
- Wrapped in Shadow DOM (`react-shadow`) to prevent style leakage
- Styles injected inline via `<style>{styles}</style>` inside shadow root

---

## Data Flow: Site Provisioning

```
1. Customer pays → WooCommerce fires INITIAL_PAYMENT_COMPLETE

2. SiteSync::site_sync_by_subscription($subscription, $args)
   a. Verify only 1 related order (parent order only — skip renewals)
   b. Loop order items → get product
   c. For each subscription/variable-subscription product:
      - Read host_type from product meta
      - Read linked_site_id from product/variation meta
      - Read host_position from product/variation meta
      - Build site_sync_params (site_url, site_id, host_position, partner_id, customer)
      - Dispatch to FetchPowerCloud::site_sync() or Fetch::site_sync()
   d. Save responses to order item meta (_pp_create_site_responses_item)
   e. Save summary response to order meta (pp_create_site_responses)
   f. Add order note with site details
   g. Fire pp_site_sync_by_subscription

3. [PowerCloud path only]
   - On HTTP 201: build email_payloads_tmp on subscription
   - Schedule 'powerhouse_delay_send_email' in 4 minutes

4. [Delayed email] SiteSync::send_email($to, $subscription_id)
   - Read email_payloads_tmp from subscription
   - Call SubscriptionEmailHooks::send_mail($to, $tokens)
   - Delete email_payloads_tmp
```

---

## Environment Configuration

`Utils\Base::set_api_auth(Bootstrap $bootstrap)` configures API credentials per environment:

| `wp_get_environment_type()` | Base URL | PowerCloud API |
|---|---|---|
| `local` | `http://cloud.local` | `http://localhost:5000` |
| `staging` | `https://test1.powerhouse.cloud` | `https://api.wpsite.pro` |
| *(production)* | `https://cloud.luke.cafe` | `https://api.wpsite.pro` |

Credentials are stored on the `Bootstrap` singleton instance (`$bootstrap->username`, `$bootstrap->psw`, `$bootstrap->base_url`, `$bootstrap->powercloud_api`, `$bootstrap->t`).

---

## Token System

`Utils\Token::replace(string $script, array $tokens): string`

Replaces `##UPPERCASEKEY##` patterns in email subject/body. Keys in the `$tokens` array are automatically uppercased. Arrays and empty values are skipped.

Token arrays are assembled in:
- `Token::get_order_tokens(\WC_Order $order)` — order-based tokens
- `Token::get_subscription_tokens(\WC_Subscription $subscription)` — subscription tokens
- Individual arrays assembled in `Api\Main` callback methods for site-credential emails
