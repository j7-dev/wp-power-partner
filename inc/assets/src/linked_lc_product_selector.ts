import $ from 'jquery';
import { LinkedLCProductSelector, selector } from './linked_lc_product_selector/index';
import './scss/index.scss';



$(function () {
	document.querySelectorAll(selector).forEach((el: Element) => {
		new LinkedLCProductSelector(el as HTMLElement);
	})
});


$('body').on('woocommerce_variations_loaded', function () {
	document.querySelectorAll(selector).forEach((el: Element) => {
		console.log(el);
		new LinkedLCProductSelector(el as HTMLElement);
	})
});
