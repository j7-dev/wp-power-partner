@ignore
Feature: 儲存 PowerCloud API Key (SavePowerCloudApiKey)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
      | 2      | User   | user@example.com  | subscriber    |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 使用者需有 manage_options 權限且已登入
    Example: 非管理員嘗試儲存 API Key 時回傳 403
      Given 用戶 "User" 已登入
      When 用戶發送 POST /wp-json/power-partner/powercloud-api-key 請求：
        | api_key | pk_abc123 |
      Then 回應狀態碼為 403

  # ========== 前置（參數）==========
  Rule: 前置（參數）- api_key 不可為空
    Example: api_key 為空時回傳 400
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/powercloud-api-key 請求：
        | api_key | |
      Then 回應狀態碼為 400
      And 回應 message 為 "api_key is required"

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- API Key 存入 transient（TTL 30 天）
    Example: 管理員成功儲存 PowerCloud API Key
      Given 用戶 "Admin" 已登入（userId = 1）
      When 用戶發送 POST /wp-json/power-partner/powercloud-api-key 請求：
        | api_key | pk_abc123 |
      Then 回應 status 為 200
      And transient "power_partner_powercloud_api_key_1" 值為 "pk_abc123"
      And transient TTL 為 30 天
