# Power Partner | 讓每個人都可以輕鬆地販售網站模板
一句話講完 Power Partner :

> Power Partner 是一個 WordPress 套件，安裝後，可以讓你的 Woocommerce 商品與 cloud.luke.cafe 的模板網站連結，並且可以讓使用者自訂商品的價格，當用戶在您的網站下單後，會自動在 cloud.luke.cafe 創建網站，並且自動發送通知給用戶跟您。

<br><br><br>

當客戶的訂閱狀態發生改變時

訂閱狀態改變要用 `woocommerce_subscription_pre_update_status` 這支 HOOK
而不是 `transition_post_status`

1. 如果不是 power partner 網站訂閱  就不會管
2. 如果訂閱沒失敗 就不處理
失敗的定義是  從 [已啟用] 變成 [已取消] 或 [保留] 等等  就算失敗， [已啟用] 變成 [已過期] 不算失敗
3. 如果訂閱失敗了  就會禁用網站那筆訂閱上層訂單連結的網站，而非用戶的所有網站
