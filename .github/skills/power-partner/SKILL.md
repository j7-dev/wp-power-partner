---
name: power-partner
description: "Power Partner — WordPress 雲端網站自動開站與合作夥伴訂閱管理外掛開發指引。WooCommerce 訂閱自動建站、授權碼分發、雙 React App（Admin/User）、cloud.luke.cafe API 整合。使用 /power-partner 觸發。"
origin: project-analyze
---

# power-partner — 開發指引

> WordPress Plugin，讓網站擁有者銷售 WordPress 網站模板（WooCommerce 訂閱制）。訂閱成立時自動透過 PowerCloud 後端開站、發送授權碼，訂閱失敗時自動停用網站。

## When to Activate

當使用者在此專案中：
- 修改 `inc/classes/**/*.php`（開站流程、訂閱管理、授權碼邏輯）
- 修改 `js/src/**/*.tsx`（React AdminApp 或 UserApp）
- 新增開站模板、授權碼分發、Email 通知功能
- 詢問 cloud.luke.cafe API、WooCommerce Subscriptions、Jotai 狀態管理相關問題

## 架構概覽

**技術棧：**
- **語言**: PHP 8.1+（`declare(strict_types=1)`）
- **框架**: WordPress 5.7+、WooCommerce 7.6+（必要）
- **關鍵依賴**: `kucrut/vite-for-wp`、`j7-dev/wp-plugin-trait`
- **前端**: React 18 + TypeScript + TanStack Query (`@tanstack/react-query ^5`) + Jotai + antd-toolkit
- **建置**: Vite（開發 port 自動）
- **代碼風格**: PHPCS（WordPress-Core）、PHPStan、ESLint + Prettier

## 目錄結構

```
power-partner/
├── plugin.php                                      # 主入口（PluginTrait + SingletonTrait）
├── inc/classes/
│   ├── Bootstrap.php                               # 初始化所有子模組
│   ├── Admin/
│   │   ├── Product.php                            # 商品 Meta（模板選擇、授權碼設定）
│   │   └── UserEdit.php                           # 用戶編輯頁（合作夥伴資訊）
│   ├── Api/
│   │   ├── SiteSync.php                           # 網站同步 API（接收 PowerCloud 回調）
│   │   └── CloudApi.php                           # cloud.luke.cafe API 客戶端
│   ├── Resources/
│   │   ├── LicenseCode/
│   │   │   ├── Api.php                            # 授權碼 REST API
│   │   │   ├── CPT.php                            # CPT 'license_code' 管理
│   │   │   └── Utils.php                          # 授權碼工具方法
│   │   └── Site/
│   │       ├── Manager.php                        # 網站生命週期管理（建立/停用/恢復）
│   │       └── Models/SiteModel.php               # 網站資料模型
│   ├── Subscription/
│   │   ├── Handler.php                            # 訂閱事件處理（建立/取消/恢復）
│   │   └── Hooks.php                              # WooCommerce Subscription Hooks
│   ├── Email/
│   │   ├── Templates/                             # HTML Email 模板（##TOKEN## 替換）
│   │   └── Mailer.php                             # Email 發送器
│   └── Utils/
│       └── Base.php                               # 基礎工具
├── js/src/
│   ├── main.tsx                                   # React 掛載入口（AdminApp + UserApp）
│   ├── AdminApp/
│   │   ├── App.tsx                                # 管理員 App（TanStack Query）
│   │   ├── pages/
│   │   │   ├── Sites/                             # 已開站網站管理
│   │   │   ├── LicenseCodes/                      # 授權碼管理
│   │   │   └── Settings/                          # 外掛設定
│   │   └── atoms/                                 # Jotai 狀態
│   ├── UserApp/
│   │   ├── App.tsx                                # 前台用戶 App
│   │   └── pages/
│   │       └── MySubscriptions/                   # 用戶訂閱管理頁
│   ├── hooks/
│   │   ├── useAjax.tsx                            # AJAX Hook
│   │   ├── useMany.tsx                            # 列表查詢
│   │   └── useOne.tsx                             # 單筆查詢
│   ├── api/
│   │   ├── axios.tsx                              # Axios 實例
│   │   └── resources/                             # API 資源定義
│   └── types/                                     # TypeScript 型別
```

## 開站流程

```
WooCommerce 訂閱建立
  → Subscription\Handler::on_subscription_created()
  → Site\Manager::provision_site($template_id, $user)
  → CloudApi::create_site($params)              ← POST cloud.luke.cafe API
  → 等待 SiteSync API 接收 PowerCloud 回調
  → Email\Mailer::send_credentials($site, $user) ← 發送含帳密的 Email
  → LicenseCode\Utils::create_and_assign()       ← 建立並分配授權碼
```

## 訂閱狀態對應

| WooCommerce 訂閱狀態 | 動作 |
|---|---|
| `active` | 建立/恢復網站 |
| `on-hold` | 暫停網站（寬限 N 天後停用） |
| `cancelled` | 停用並刪除網站 |
| `expired` | 停用網站 |

## Email 模板 Token 替換

```php
// ##TOKEN## 格式，支援的 token：
// ##SITE_URL## — 新建站台 URL
// ##SITE_ADMIN_URL## — WordPress 管理後台
// ##USERNAME## — 登入帳號
// ##PASSWORD## — 初始密碼
// ##LICENSE_CODE## — 授權碼
// ##CUSTOMER_NAME## — 客戶姓名

$email_body = str_replace('##SITE_URL##', $site_url, $template);
```

## cloud.luke.cafe API 整合

```php
// CloudApi — 網站生命週期管理
class CloudApi {
    public function create_site(array $params): array { ... }
    public function suspend_site(string $site_id): void { ... }
    public function resume_site(string $site_id): void { ... }
    public function delete_site(string $site_id): void { ... }
}
// 認證方式：API Key（儲存於 WordPress options）
```

## 前端架構（雙 App）

```typescript
// main.tsx — 掛載兩個獨立 React App
// AdminApp：掛載於後台管理頁面
ReactDOM.createRoot(document.getElementById('admin-app')!).render(<AdminApp />);

// UserApp：掛載於前台用戶頁面（訂閱管理短碼）
ReactDOM.createRoot(document.getElementById('user-app')!).render(<UserApp />);
```

```typescript
// Jotai atoms 管理全域狀態
import { atom } from 'jotai';
export const selectedSiteAtom = atom<string | null>(null);
```

## 命名慣例

| 類型 | 慣例 | 範例 |
|------|------|------|
| PHP Namespace | PascalCase | `J7\PowerPartner\Resources\LicenseCode` |
| PHP 類別 | PascalCase（final） | `final class Manager` |
| CPT | snake_case | `license_code` |
| React 元件 | PascalCase | `SiteList`、`LicenseCodeTable` |
| Hook | use 前綴 | `useAjax`、`useMany` |
| Text Domain | snake_case | `power_partner` |

## 開發規範

1. 訂閱狀態變更邏輯統一在 `Subscription/Handler.php` 處理
2. 所有雲端 API 呼叫透過 `CloudApi` 類別，不直接呼叫 `wp_remote_post()`
3. Email 模板使用 `##TOKEN##` 格式替換，保持 HTML 模板可由管理員自訂
4. 授權碼建立後立即綁定到 WooCommerce 訂閱 ID，方便後續追蹤
5. 前台 UserApp 和後台 AdminApp 為獨立入口點，分別處理不同角色需求

## 常用指令

```bash
composer install           # 安裝 PHP 依賴
pnpm install               # 安裝 Node 依賴
pnpm dev                   # Vite 開發伺服器
pnpm build                 # 建置到 js/dist/
vendor/bin/phpcs           # PHP 代碼風格檢查
vendor/bin/phpstan analyse # PHPStan 靜態分析
pnpm release               # 發佈 patch 版本
```

## 相關 SKILL

- `wordpress-master` — WordPress Plugin 開發通用指引
- `react-master` — React 前端開發指引
- `wp-rest-api` — REST API 設計規範
- `power-partner-server` — 授權碼管理主機端
