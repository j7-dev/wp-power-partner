@ignore
Feature: 變更訂閱綁定 (ChangeSubscription)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
    And 系統中有以下訂閱：
      | subscriptionId | linked_site_ids  |
      | 500            | site-a, site-b   |
      | 501            | site-c           |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 使用者需有 manage_options 權限
    Example: 非管理員嘗試變更綁定時回傳 403
      Given 一個 subscriber 用戶已登入
      When 用戶發送 POST /wp-json/power-partner/change-subscription
      Then 回應狀態碼為 403

  # ========== 前置（參數）==========
  Rule: 前置（參數）- subscription_id 與 site_id 不可為空
    Example: 缺少 subscription_id 時回傳 500
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/change-subscription 請求：
        | subscription_id | |
        | site_id         | site-a |
        | linked_site_ids | ["site-a"] |
      Then 回應 status 為 500
      And 回應 message 為 "missing subscription id or site id"

  Rule: 前置（參數）- linked_site_ids 必須為陣列
    Example: linked_site_ids 不是陣列時回傳 500
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/change-subscription 請求：
        | subscription_id | 501    |
        | site_id         | site-a |
        | linked_site_ids | "not-array" |
      Then 回應 status 為 500
      And 回應 message 為 "linked_site_ids is not array"

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 原訂閱解綁，新訂閱綁定
    Example: 將 site-a 從訂閱 #500 搬到訂閱 #501
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/change-subscription 請求：
        | subscription_id | 501              |
        | site_id         | site-a           |
        | linked_site_ids | ["site-a", "site-c"] |
      Then 回應 status 為 200
      And 訂閱 #500 的 pp_linked_site_ids 不再包含 "site-a"
      And 訂閱 #501 的 pp_linked_site_ids 包含 "site-a" 與 "site-c"
