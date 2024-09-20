var d=Object.defineProperty;var _=(n,t,e)=>t in n?d(n,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):n[t]=e;var o=(n,t,e)=>_(n,typeof t!="symbol"?t+"":t,e);const l=window.jQuery,a=".linked_lc_product_selector";var u;const c=((u=window==null?void 0:window.linked_lc_product_selector_data)==null?void 0:u.cloud_products)||[],h=[...(c==null?void 0:c.map(({slug:n,label:t})=>({slug:n,label:t})))||[]];class r{constructor(t){o(this,"$el");o(this,"_field_name");o(this,"_list",[]);this.$el=l(t),this._field_name=this.$el.data("field_name")??"linked_lc_products",this._list=this.$el.data("default_linked_lc_products")||[],this.render(),this.attachEvent()}set list(t){this._list=t,this.render()}renderRow(t,e){const i=this._field_name;return`
		<div data-index="${e}" class="lc-row flex gap-x-2 mb-2 items-center">
			<select class="flex-1" name="${i}[${e}][product_slug]">
			${h.map(s=>`
				<option value="${s.slug}" ${s.slug===t.product_slug?"selected":""}>${s.label}</option>
			`).join("")}
		</select>
		<input type="number" min="0" step="1" class="!w-20" placeholder="數量" value="${t.quantity}" name="${i}[${e}][quantity]" />
		<button event="remove" type="button" class="button">移除</button>
	</div>
`}render(){this.$el.html(`
			${this._list.map((t,e)=>this.renderRow(t,e)).join("")}
			<button type="button" event="add" class="button button-primary w-full"> + 新增</button>
		`)}attachEvent(){this.$el.on("click",'button[event="add"]',()=>{this.list=[...this._list,{product_slug:"",quantity:1}]}),this.$el.on("click",'button[event="remove"]',t=>{const e=l(t.currentTarget).closest(".lc-row").data("index");this.list=this._list.filter((i,s)=>s!==e)}),this.$el.on("change","select",t=>{const e=l(t.currentTarget).closest(".lc-row").data("index");this._list[e].product_slug=l(t.currentTarget).val()}),this.$el.on("change","input",t=>{const e=l(t.currentTarget).closest(".lc-row").data("index");this._list[e].quantity=l(t.currentTarget).val()})}}l(function(){document.querySelectorAll(a).forEach(n=>{new r(n)})}),l("body").on("woocommerce_variations_loaded",function(){document.querySelectorAll(a).forEach(n=>{console.log(n),new r(n)})});
