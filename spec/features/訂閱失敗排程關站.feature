@ignore
Feature: 訂閱失敗排程關站 (ScheduleDisableSite)

  Background:
    Given 系統中有以下用戶：
      | userId | name     | email                | role       |
      | 10     | Customer | customer@example.com | subscriber |
    And 系統設定 disable_site_after_n_days 為 7
    And 系統中有以下訂閱：
      | subscriptionId | status    | linked_site_ids | host_type  |
      | 500            | wc-active | site-a          | powercloud |
      | 501            | wc-active | site-b          | wpcd       |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 訂閱狀態從 active 變為失敗狀態才觸發
    Example: 訂閱從 active 變為 cancelled 時排程關站
      Given 訂閱 #500 狀態為 wc-active
      When WooCommerce 觸發 SUBSCRIPTION_FAILED hook（active -> cancelled）
      Then 系統建立 ActionScheduler 排程，7 天後執行關站

    Example: 訂閱從 active 變為 expired 時不觸發關站排程
      Given 訂閱 #500 狀態為 wc-active
      When 訂閱自然到期（active -> expired）
      Then 不會建立關站排程

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 排程到期後根據 host_type 呼叫對應停站 API
    Example: PowerCloud 網站在排程到期後被停止
      Given 訂閱 #500 已排程關站（host_type = powercloud）
      When ActionScheduler 排程到期執行
      Then 系統呼叫 PowerCloud API PATCH /wordpress/{websiteId}/stop

    Example: WPCD 網站在排程到期後被停用
      Given 訂閱 #501 已排程關站（host_type = wpcd）
      When ActionScheduler 排程到期執行
      Then 系統呼叫 CloudServer API POST /wp-json/power-partner-server/v2/disable-site
      And 停用原因包含訂閱 ID 與訂單號碼
