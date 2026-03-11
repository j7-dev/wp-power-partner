@ignore
Feature: 查詢合作夥伴 ID (GetPartnerId)

  Background:
    Given 系統中有以下用戶：
      | userId | name     | email                | role       |
      | 10     | Customer | customer@example.com | subscriber |

  # ========== 前置（參數）==========
  Rule: 前置（參數）- 無須特殊參數（public API）
    Example: 任何人都可以查詢 partner_id
      When 用戶發送 GET /wp-json/power-partner/partner-id
      Then 回應狀態碼為 200

  # ========== 後置（回應）==========
  Rule: 後置（回應）- 回傳 partner_id 或空值提示
    Example: 已設定 partner_id 時回傳成功
      Given 系統已設定 partner_id 為 "12345"
      When 用戶發送 GET /wp-json/power-partner/partner-id
      Then 回應 status 為 200
      And 回應 data.partner_id 為 "12345"

    Example: 未設定 partner_id 時回傳失敗
      Given 系統未設定 partner_id
      When 用戶發送 GET /wp-json/power-partner/partner-id
      Then 回應 status 為 500
      And 回應 message 為 "fail, partner_id is empty"
