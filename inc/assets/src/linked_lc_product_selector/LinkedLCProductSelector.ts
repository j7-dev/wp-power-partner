import $ from 'jquery'
import { cloud_products, TCloudProduct } from './utils'


const avlProducts: TCloudProduct[] = [
	...(cloud_products?.map(({ slug, label }) => ({
		slug,
		label
	})) || [])
]

type TLC = {
	product_slug: string
	quantity: number
}

const mock_list: TLC[] = [
	{
		product_slug: 'power-course',
		quantity: 1,
	},
	{
		product_slug: 'power-shop',
		quantity: 2,
	},
]


export class LinkedLCProductSelector {
	$el: JQuery<HTMLElement>
	_field_name: string
	_list: TLC[] = []

	constructor(element: HTMLElement) {
		this.$el = $(element)
		this._field_name = this.$el.data('field_name') ?? 'linked_lc_products'
		this._list = this.$el.data('default_linked_lc_products') || []

		this.render()
		this.attachEvent()
	}

	set list(list: TLC[]) {
		this._list = list
		this.render()
	}

	renderRow(item: TLC, index: number) {
		const NAME = this._field_name
		return /*html*/`
		<div data-index="${index}" class="lc-row" style="display: flex; gap: 0.5em; margin-bottom: 0.75em; padding: 0.75em; background: #f9f9f9; border-radius: 4px; border: 1px solid #c3c4c7; align-items: center;">
			<select name="${NAME}[${index}][product_slug]" style="flex: 1; min-width: 0; height: 32px; padding: 0 8px; border: 1px solid #8c8f94; border-radius: 3px; background: #fff;">
			${avlProducts.map((product) => /*html*/ `
				<option value="${product.slug}" ${product.slug === item.product_slug ? 'selected' : ''}>${product.label}</option>
			`).join('')}
		</select>
		<input type="number" min="0" max="100" step="1" placeholder="數量" value="${item.quantity}" name="${NAME}[${index}][quantity]" style="width: 80px; height: 32px; padding: 0 8px; text-align: center; border: 1px solid #8c8f94; border-radius: 3px; background: #fff;" />
		<button event="remove" type="button" class="button" style="white-space: nowrap; height: 32px; line-height: 30px; padding: 0 12px;">移除</button>
	</div>
`}

	render() {
		this.$el.html(/*html*/ `
			<div style="margin-bottom: 1em;">
				${this._list.map((item, index) => this.renderRow(item, index)).join('')}
			</div>
			<button type="button" event="add" class="button button-primary" style="width: 100%; margin-top: 0.5em; height: 36px; line-height: 34px;">+ 新增</button>
		`)


	}

	attachEvent() {
		this.$el.on('click', 'button[event="add"]', () => {
			this.list = [...this._list, {
				product_slug: '',
				quantity: 1,
			}]
		})

		this.$el.on('click', 'button[event="remove"]', (e) => {
			const index = $(e.currentTarget).closest('.lc-row').data('index')
			this.list = this._list.filter((_, i) => i !== index)
		})


		this.$el.on('change', 'select', (e) => {
			const index = $(e.currentTarget).closest('.lc-row').data('index')
			this._list[index].product_slug = $(e.currentTarget).val()
		})

		this.$el.on('change', 'input', (e) => {
			const index = $(e.currentTarget).closest('.lc-row').data('index')
			this._list[index].quantity = $(e.currentTarget).val()
		})
	}


}
