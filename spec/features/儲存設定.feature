@ignore
Feature: 儲存設定 (SaveSettings)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
      | 2      | User   | user@example.com  | subscriber    |
    And 系統中有以下設定：
      | key                                     | value |
      | power_partner_disable_site_after_n_days  | 7     |

  # ========== 前置（狀態）==========
  Rule: 前置（狀態）- 使用者需有 manage_options 權限
    Example: 非管理員嘗試儲存設定時回傳 403
      Given 用戶 "User" 已登入
      When 用戶發送 POST /wp-json/power-partner/settings 請求：
        | power_partner_disable_site_after_n_days | 14 |
      Then 回應狀態碼為 403

  # ========== 前置（參數）==========
  Rule: 前置（參數）- 請求 body 會經過 sanitize 處理
    Example: 含有 HTML 標籤的值會被清除（emails 欄位除外）
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/settings 請求：
        | power_partner_disable_site_after_n_days | <script>alert(1)</script>7 |
      Then 回應狀態碼為 200
      And 設定值 power_partner_disable_site_after_n_days 不含 HTML 標籤

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- power_partner_settings option 被更新
    Example: 管理員成功儲存關站天數與 Email 設定
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/settings 請求：
        | power_partner_disable_site_after_n_days | 14 |
      Then 回應狀態碼為 200
      And wp_options 中 power_partner_settings.power_partner_disable_site_after_n_days 為 14

  Rule: 後置（狀態）- 關站天數變更時重新排程所有 pending 的關站排程
    Example: 將關站天數從 7 天改為 14 天
      Given 用戶 "Admin" 已登入
      And 系統中有一個 pending 的關站排程（原本 7 天後執行）
      When 用戶發送 POST /wp-json/power-partner/settings 請求：
        | power_partner_disable_site_after_n_days | 14 |
      Then 原本的關站排程被取消
      And 建立新的關站排程，延遲 14 天後執行

  Rule: 後置（狀態）- Email 排程設定變更時重新排程所有訂閱 Email
    Example: 修改 trial_end Email 的 days 設定
      Given 用戶 "Admin" 已登入
      And 系統中有啟用的 Email 模板（action_name = trial_end, days = 3, operator = before）
      When 用戶將該 Email 的 days 改為 5 並儲存
      Then 所有符合條件的訂閱 Email 排程被重新計算
