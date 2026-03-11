@ignore
Feature: 訂閱首次付款自動開站 (SiteSyncBySubscription)

  Background:
    Given 系統中有以下用戶：
      | userId | name     | email                | role     |
      | 1      | Admin    | admin@example.com    | administrator |
      | 10     | Customer | customer@example.com | subscriber    |
    And 系統已設定 partner_id 為 "12345"
    And 系統中有以下訂閱商品：
      | productId | type                    | host_type  | linked_site | host_position | open_site_plan |
      | 100       | subscription            | powercloud | template-1  | tw            | plan-1         |
      | 200       | variable-subscription   | wpcd       | template-2  | jp            |                |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 只有首次付款（只有一筆關聯訂單）才觸發開站
    Example: 續訂付款不觸發開站
      Given 用戶 "Customer" 有一個訂閱 #500，已有 2 筆關聯訂單
      When WooCommerce 觸發 INITIAL_PAYMENT_COMPLETE hook
      Then 不會呼叫任何開站 API

  Rule: 前置（狀態）- 商品必須有設定模板站 ID
    Example: 商品未設定 linked_site 時跳過
      Given 用戶 "Customer" 購買了未設定 linked_site 的訂閱商品
      When WooCommerce 觸發 INITIAL_PAYMENT_COMPLETE hook
      Then 不會呼叫任何開站 API

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- PowerCloud 新架構開站成功後排程發送帳密 Email
    Example: 客戶購買 PowerCloud 商品，首次付款成功後自動開站
      Given 用戶 "Customer" 購買了商品 #100（host_type = powercloud）
      And 訂閱 #500 被創建，只有一筆父訂單 #600
      When WooCommerce 觸發 INITIAL_PAYMENT_COMPLETE hook
      Then 系統呼叫 PowerCloud API POST /wordpress 建立網站
      And 開站結果存入訂單 #600 的 meta pp_create_site_responses
      And 開站結果存入訂單項目的 meta _pp_create_site_responses_item
      And 訂閱 #500 標記 is_power_partner_site_sync = 1
      And 系統排程 4 分鐘後發送帳密 Email 給 customer@example.com
      And 觸發 pp_site_sync_by_subscription action

  Rule: 後置（狀態）- WPCD 舊架構開站（異步，由 CloudServer 回調通知）
    Example: 客戶購買 WPCD 商品，首次付款成功後呼叫舊架構開站 API
      Given 用戶 "Customer" 購買了商品 #200（host_type = wpcd）
      And 訂閱 #501 被創建，只有一筆父訂單 #601
      When WooCommerce 觸發 INITIAL_PAYMENT_COMPLETE hook
      Then 系統呼叫 CloudServer API POST /wp-json/power-partner-server/site-sync
      And 開站結果存入訂單 meta
      And 觸發 pp_site_sync_by_subscription action
