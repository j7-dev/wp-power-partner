const t=window.jQuery;function e(){const n=t("#linked_site"),a=t("input[name='linked_site']");n.on("change",function(o){o.stopPropagation();const s=t(this).val();console.log("⭐  value:",s),a.val(s)})}function i(){const n=t("#power_partner_product_data");t("ul.wc-tabs > li").on("click",function(o){o.stopPropagation(),t(this).hasClass("power_partner_options")?n.show():n.hide()}),e()}(function(n){n(document).ready(function(){i()})})(jQuery);