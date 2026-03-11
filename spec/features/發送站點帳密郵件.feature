@ignore
Feature: 發送站點帳密郵件 (SendSiteCredentialsEmail)

  Background:
    Given 系統中有以下用戶：
      | userId | name   | email             | role          |
      | 1      | Admin  | admin@example.com | administrator |
    And 系統中有以下 Email 模板：
      | action_name | enabled | subject                         | body                                  |
      | site_sync   | 1       | 你的網站 ##DOMAIN## 開好囉       | 密碼: ##SITEPASSWORD## URL: ##FRONTURL## |

  # ========== 前置（參數）==========
  Rule: 前置（參數）- domain 與 password 為必填
    Example: 缺少 domain 時回傳 400
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/send-site-credentials-email 請求：
        | domain   |          |
        | password | p@ssw0rd |
      Then 回應狀態碼為 400
      And 回應 message 包含 "缺少必要參數"

  Rule: 前置（狀態）- 必須存在 site_sync Email 模板
    Example: 無 site_sync 模板時回傳 404
      Given 用戶 "Admin" 已登入
      And 系統中沒有啟用的 site_sync Email 模板
      When 用戶發送 POST /wp-json/power-partner/send-site-credentials-email 請求：
        | domain   | mysite.wpsite.pro |
        | password | p@ssw0rd          |
      Then 回應狀態碼為 404
      And 回應 message 包含 "找不到郵件模板"

  # ========== 後置（狀態）==========
  Rule: 後置（狀態）- 使用 site_sync 模板發送 Email
    Example: 管理員成功發送帳密 Email
      Given 用戶 "Admin" 已登入
      When 用戶發送 POST /wp-json/power-partner/send-site-credentials-email 請求：
        | domain   | mysite.wpsite.pro |
        | password | p@ssw0rd          |
        | username | admin             |
        | ip       | 163.61.60.30      |
      Then 回應 status 為 200
      And 系統發送 Email 到 admin@example.com
      And Email 主旨包含 "mysite.wpsite.pro"
      And Email 內容包含 "p@ssw0rd"
