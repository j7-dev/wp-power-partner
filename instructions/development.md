# Power Partner — Development Guide
#
# This file belongs at: instructions/development.md
# Run setup-docs.ps1 to create the instructions/ directory, then move this file there.

# Power Partner — Development Guide

**Last Updated:** 2025-01-01

---

## Prerequisites

- PHP 8.1+ with extensions: `json`, `mbstring`, `openssl`
- Composer 2.x
- Node.js 18+ and pnpm (monorepo uses pnpm workspaces)
- Local WordPress install with:
  - WooCommerce ≥ 7.6
  - Woo Subscriptions ≥ 5.9
  - Powerhouse plugin ≥ 3.3.23

---

## Initial Setup

```bash
# 1. Install PHP dependencies
composer install

# 2. Install JS dependencies (from monorepo root)
cd ../..  # go to turborepo root
pnpm install
```

---

## Daily Development

### Start Vite dev server
```bash
cd apps/power-partner
pnpm dev   # starts on http://localhost:5176
```

The dev server uses `@kucrut/vite-for-wp` which outputs an `asset-manifest.json` that WordPress reads to load the correct scripts with HMR support.

### WordPress must be running
The PHP side renders the mount points (`<div id="power-partner-connect-app">`). Vite serves the JS assets. Both must run simultaneously for the admin page to work in development.

### Environment type
Set `WP_ENVIRONMENT_TYPE` in `wp-config.php`:
```php
define('WP_ENVIRONMENT_TYPE', 'local');   // or 'staging'
```
This controls which API endpoints the plugin targets (see `Utils\Base::set_api_auth()`).

---

## Build for Production

```bash
# Standard build (uses vite.config.ts)
pnpm build

# WordPress-specific build (uses vite.config-for-wp.ts)
pnpm build:wp
```

Output goes to `js/dist/`. The `js/dist/` directory should be committed for distribution.

---

## Code Quality

### PHP
```bash
# Run PHPCS (code sniffer)
composer lint         # phpcs

# Auto-fix fixable issues
vendor/bin/phpcbf

# Run PHPStan (static analysis)
vendor/bin/phpstan analyse
```

Configuration:
- `phpcs.xml` — PHPCS ruleset (WPCS + custom rules)
- `phpstan.neon` — PHPStan config (level 5)

### JavaScript / TypeScript
```bash
pnpm lint          # ESLint check
pnpm lint:fix      # ESLint + PHPCBF auto-fix
pnpm format        # Prettier format js/src/**/*.tsx
```

---

## Testing

```bash
# PHP tests (Pest + wp-pest)
vendor/bin/pest

# Or via PHPUnit
vendor/bin/phpunit
```

Test files are in `inc/classes/Test/`. The `Test\Retry` class is only loaded in `local` environment.

---

## Version Management

Version is stored in **two places** that must stay in sync:
- `package.json` → `"version": "3.2.4"`
- `plugin.php` → `* Version: 3.2.4`

Use the sync script to keep them aligned:
```bash
pnpm sync:version   # reads package.json, writes to plugin.php
```

---

## Release Process

```bash
# Patch release (bug fixes: 3.2.4 → 3.2.5)
pnpm release:patch

# Minor release (new features: 3.2.4 → 3.3.0)
pnpm release:minor

# Major release (breaking changes: 3.2.4 → 4.0.0)
pnpm release:major
```

These commands use `release-it` configured in `release/.release-it.cjs`. They:
1. Bump version in `package.json`
2. Run `pnpm sync:version` to update `plugin.php`
3. Run `pnpm build:wp`
4. Create a Git tag
5. Push to GitHub and create a Release with the ZIP attached

### Create ZIP manually
```bash
pnpm zip
```

---

## Directory Structure for New Features

### Adding a PHP domain feature
Follow the Domain-Driven Design pattern already in the codebase:

```
inc/classes/Domains/
└── MyDomain/
    ├── Core/
    │   ├── MyHooks.php          # Wires WordPress hooks
    │   └── MyApi.php            # REST endpoints (if needed)
    ├── DTOs/
    │   └── MyDTO.php            # Data transfer objects
    ├── Models/
    │   └── MyModel.php          # Business logic models
    ├── Services/
    │   └── MyScheduler.php      # ActionScheduler wrapper (if needed)
    └── Shared/
        └── Enums/               # PHP 8.1 enums
```

### Adding a React page/component

```
js/src/pages/AdminApp/Dashboard/
└── MyFeature/
    ├── index.tsx               # Main component
    ├── hooks/                  # Feature-specific hooks
    └── types.ts                # Feature-specific types
```

Then add a new tab entry in `js/src/pages/AdminApp/Dashboard/index.tsx`.

---

## Common Development Tasks

### Refreshing template cache
When testing template site changes, clear the transient:
```bash
# Via WP CLI
wp transient delete power_partner_allowed_template_options
wp transient delete power_partner_allowed_template_options_powercloud

# Or via REST API (requires manage_options)
POST /wp-json/power-partner/clear-template-sites-cache
```

### Inspecting ActionScheduler jobs
Go to **WooCommerce → Status → Scheduled Actions** or use WP CLI:
```bash
wp action-scheduler list --hook=power_partner_disable_site
wp action-scheduler list --hook=power_partner_send_email
```

### Checking WC logs
Plugin uses the `power_partner` source for WC logger:
```bash
# Logs are at: wp-content/uploads/wc-logs/power_partner-*.log
# Or WP Admin: WooCommerce → Status → Logs
```

### Testing subscription lifecycle locally
1. Set environment type to `local`
2. Create a subscription product with a linked template site
3. Complete a test order
4. Check WC logs for `訂閱 #X site sync` entries
5. ActionScheduler will run the email job within 4 minutes

---

## Key Files Reference

| File | What to change when... |
|---|---|
| `plugin.php` | Changing plugin version, required plugin versions, default email body |
| `inc/classes/Bootstrap.php` | Adding a new singleton class to the bootstrap chain |
| `inc/classes/Utils/Base.php` | Adding new environment configs, changing API endpoints |
| `inc/classes/Api/Main.php` | Adding new REST endpoints for core features |
| `inc/classes/Api/FetchPowerCloud.php` | Changing PowerCloud API integration |
| `inc/classes/Api/Fetch.php` | Changing WPCD API integration |
| `inc/classes/Product/DataTabs/LinkedSites.php` | Adding/modifying product configuration fields |
| `inc/classes/Domains/Email/Core/SubscriptionEmailHooks.php` | Adding new email trigger points |
| `inc/classes/Domains/Settings/Core/WatchSettingHooks.php` | Handling settings changes |
| `js/src/pages/AdminApp/Dashboard/index.tsx` | Adding/removing admin dashboard tabs |
| `js/src/utils/index.ts` | Updating shared frontend constants |

---

## Monorepo Notes

This plugin is part of `powerrepo` (Turborepo monorepo).

Shared configurations used:
- **ESLint**: `@power/eslint-config` (workspace package)
- **Tailwind**: `@power/tailwind-config` (workspace package)
- **TypeScript**: `@power/typescript-config` (workspace package)
- **Ant Design toolkit**: `antd-toolkit` (workspace package)

The `.npmrc` file configures pnpm workspace resolution. Do not change `node_modules` structure manually.

Environment variables for release scripts are read from `../../.env` (monorepo root `.env`).

---

## Debugging Tips

### PHP errors not showing?
Ensure `WP_DEBUG` and `WP_DEBUG_LOG` are `true` in `wp-config.php`.

### React app not loading?
1. Check browser console for JS errors
2. Verify Vite dev server is running (`pnpm dev`)
3. Check that `js/dist/` exists (for production) or that `WP_ENVIRONMENT_TYPE=local`
4. Verify the mount point HTML exists (`#power-partner-connect-app`)

### API calls failing?
1. Check `wpApiSettings.nonce` is set in window (inspect console)
2. Check CORS headers if calling from different origin
3. Check IP whitelist for `/customer-notification` and `/link-site` routes

### PowerCloud provisioning failing?
1. Ensure `power_partner_powercloud_api_key_{user_id}` transient exists
2. Ask the admin to re-authenticate in the **新架構權限** tab
3. Check `power_partner` WC logs for the error message

### Email not sending?
1. Check `power_partner_settings['emails']` has at least one enabled template with `action_name: 'site_sync'`
2. Check ActionScheduler for pending `power_partner_send_email` actions
3. Verify WP mail is configured (test with a mail plugin)
