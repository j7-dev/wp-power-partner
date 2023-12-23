# Power Partner Server 版 | 一些WPCD的額外設定，讓 partner 都可以輕鬆地販售網站模板
一句話講完 Power Partner Server 版 :

> Power Partner Server版 是一個 WordPress 套件，安裝後，在 WPCD 選單會有額外的設定，可以指定讓 partner 們販售的網站要開在哪一台主機。

<br><br><br>

## 1. 擴充 WPCD 的 Tab

![image](https://github.com/j7-dev/wp-power-partner-server/assets/9213776/cde8d3cf-7c9e-4fb7-aedd-969bd63a19f9)

<br><br><br>

## 2. 提供 API 給接受外部呼叫來 sync site (即複製模板網站) 到指定 Server

API endpoint: [POST] `{home_url}/power-partner-server/site-sync/{id}`

將會複製 `site_id={id}` 的網站複製在允許的 Server 其中一台(隨機)
