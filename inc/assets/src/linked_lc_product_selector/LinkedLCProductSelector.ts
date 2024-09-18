import $ from 'jquery'
import {  cloud_products, TCloudProduct } from './utils'


const avlProducts:TCloudProduct[] = [
	{
		slug: 'any',
		label: '任意產品'
	},
	...(cloud_products?.map(({slug, label}) => ({
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
	{
		product_slug: 'any',
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
		console.log("⭐  NAME:", NAME)
		return /*html*/`
		<div data-index="${index}" class="lc-row flex gap-x-2 mb-2 items-center">
			<select class="flex-1" name="${NAME}[${index}][product_slug]">
			${avlProducts.map((product) => /*html*/ `
				<option value="${product.slug}" ${product.slug === item.product_slug ? 'selected' : ''}>${product.label}</option>
			`).join('')}
		</select>
		<input type="number" class="!w-20" placeholder="數量" value="${item.quantity}" name="${NAME}[${index}][quantity]" />
		<button event="remove" type="button" class="button">移除</button>
	</div>
`}

	render() {
		this.$el.html(/*html*/ `
			${this._list.map((item, index) => this.renderRow(item, index)).join('')}
			<button type="button" event="add" class="button button-primary w-full"> + 新增</button>
		`)


	}

	attachEvent() {
		this.$el.on('click', 'button[event="add"]', () => {
			this.list = [...this._list, {
				product_slug: 'any',
				quantity: 1,
			}]
		})

		this.$el.on('click', 'button[event="remove"]', (e) => {
			const index = $(e.currentTarget).closest('.lc-row').data('index')
			console.log('this._list', this._list)
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
