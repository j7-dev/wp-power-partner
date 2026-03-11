@ignore
Feature: 訂閱恢復取消關站並重啟 (CancelDisableSiteAndRestart)

  Background:
    Given 系統中有以下用戶：
      | userId | name     | email                | role       |
      | 10     | Customer | customer@example.com | subscriber |
    And 系統中有以下訂閱：
      | subscriptionId | status       | linked_site_ids | host_type  |
      | 500            | wc-cancelled | site-a          | powercloud |
      | 501            | wc-on-hold   | site-b          | wpcd       |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 訂閱狀態變回 active 才觸發
    Example: 訂閱從 cancelled 恢復為 active
      Given 訂閱 #500 狀態為 wc-cancelled
      And 訂閱 #500 有 pending 的關站排程
      When WooCommerce 觸發 SUBSCRIPTION_SUCCESS hook（cancelled -> active）
      Then 系統取消 pending 的關站排程
      And 系統呼叫 PowerCloud API PATCH /wordpress/{websiteId}/start 重啟網站

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 對所有連結的網站呼叫啟用 API
    Example: WPCD 網站在訂閱恢復後被重新啟用
      Given 訂閱 #501 狀態為 wc-on-hold
      And 訂閱 #501 連結了 site-b（host_type = wpcd）
      When WooCommerce 觸發 SUBSCRIPTION_SUCCESS hook（on-hold -> active）
      Then 系統取消 pending 的關站排程
      And 系統呼叫 CloudServer API POST /wp-json/power-partner-server/v2/enable-site 啟用 site-b
