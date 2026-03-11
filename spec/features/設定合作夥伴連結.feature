@ignore
Feature: 設定合作夥伴連結 (SetPartnerId)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
      | 2      | User   | user@example.com  | subscriber    |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 使用者需有 manage_options 權限
    Example: 非管理員嘗試設定 partner_id 時回傳 403
      Given 用戶 "User" 已登入
      When 用戶發送 POST /wp-json/power-partner/partner-id 請求：
        | partner_id | 12345 |
      Then 回應狀態碼為 403

  # ========== 前置（參數）==========
  Rule: 前置（參數）- partner_id 不可為空
    Example: partner_id 為空時回傳狀態 100
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/partner-id 請求：
        | partner_id | |
      Then 回應 status 為 100
      And 回應 message 為 "partner_id is empty"

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 成功儲存 partner_id 及帳號資訊
    Example: 管理員設定合作夥伴連結
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/partner-id 請求：
        | partner_id               | 12345                    |
        | encrypted_account_info   | encrypted_data_here      |
        | allowed_template_options | {"100": "Template Site"} |
      Then 回應 status 為 200
      And wp_options 中 power_partner_partner_id 為 "12345"
      And wp_options 中 power_partner_account_info 為 "encrypted_data_here"
      And transient power_partner_allowed_template_options 包含模板站資料
