@ignore
Feature: 查詢帳號資訊 (GetAccountInfo)

  Background:
    Given 系統已設定 account_info 為 "encrypted_account_data"

  # ========== 前置（參數）==========
  Rule: 前置（參數）- 無須參數（public API）
    Example: 任何人都可以查詢帳號資訊
      When 用戶發送 GET /wp-json/power-partner/account-info
      Then 回應狀態碼為 200

  # ========== 後置（回應）==========
  Rule: 後置（回應）- 回傳加密的帳號資訊
    Example: 成功取得加密帳號資訊
      When 用戶發送 GET /wp-json/power-partner/account-info
      Then 回應 status 為 200
      And 回應 data.encrypted_account_info 為 "encrypted_account_data"
