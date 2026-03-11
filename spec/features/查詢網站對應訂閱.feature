@ignore
Feature: 查詢網站對應訂閱 (GetApps)

  Background:
    Given 系統中有以下訂閱：
      | subscriptionId | linked_site_ids |
      | 500            | site-a          |
      | 501            | site-a, site-b  |
      | 502            | site-c          |

  # ========== 前置（參數）==========
  Rule: 前置（參數）- app_ids 為陣列
    Example: 不帶 app_ids 時回傳空陣列
      When 用戶發送 GET /wp-json/power-partner/apps
      Then 回應狀態碼為 200
      And 回應為空陣列

  # ========== 後置（回應）==========
  Rule: 後置（回應）- 回傳每個 app_id 對應的 subscription_ids
    Example: 查詢 site-a 與 site-c 的對應訂閱
      When 用戶發送 GET /wp-json/power-partner/apps?app_ids[]=site-a&app_ids[]=site-c
      Then 回應狀態碼為 200
      And 回應包含：
        | app_id | subscription_ids |
        | site-a | [500, 501]       |
        | site-c | [502]            |
