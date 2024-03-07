import $ from "jquery";
import linkedSite from "./linkedSite.ts";

/**
 * WC 產品類型下拉選單
 * 選擇不同產品類型選單時，顯示不同內容
 */
function productTab() {
  const tabContent = $("#power_partner_product_data");
  const tabs = $("ul.wc-tabs > li");

  tabs.on("click", function (e) {
    e.stopPropagation();
    const hasClass = $(this).hasClass("power_partner_options");
    if (hasClass) {
      tabContent.show();
    } else {
      tabContent.hide();
    }
  });

  linkedSite();
}

export default productTab;
