@ignore
Feature: 刪除合作夥伴連結 (DeletePartnerId)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
    And 系統已設定 partner_id 為 "12345"
    And 系統已設定 account_info 為 "encrypted_data"

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 使用者需有 manage_options 權限
    Example: 非管理員嘗試刪除時回傳 403
      Given 一個 subscriber 用戶已登入
      When 用戶發送 DELETE /wp-json/power-partner/partner-id
      Then 回應狀態碼為 403

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 所有合作夥伴相關資料被清除
    Example: 管理員成功刪除合作夥伴連結
      Given 用戶 "Admin" 已登入
      When 用戶發送 DELETE /wp-json/power-partner/partner-id
      Then 回應 status 為 200
      And wp_options 中 power_partner_partner_id 被刪除
      And wp_options 中 power_partner_account_info 被刪除
      And transient power_partner_allowed_template_options 被刪除
