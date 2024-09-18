/**
 * TODO 加入到 antd-toolkit utils
 *
 */

export const ORDER_STATUSES = [
	{
		value: 'wc-active',
		label: '已啟用',
		color: 'green',
	},
	{
		value: 'wc-pending',
		label: '待審核',
		color: 'magenta',
	},
	{
		value: 'wc-processing',
		label: '處理中',
		color: 'blue',
	},
	{
		value: 'wc-on-hold',
		label: '保留',
		color: 'orange',
	},
	{
		value: 'wc-completed',
		label: '完成',
		color: 'green',
	},
	{
		value: 'wc-cancelled',
		label: '已取消',
		color: '#555555',
	},
	{
		value: 'wc-refunded',
		label: '已退費',
		color: 'purple',
	},
	{
		value: 'wc-failed',
		label: '失敗',
		color: 'red',
	},
	{
		value: 'wc-checkout-draft',
		label: '草稿',
		color: 'default',
	},
]

export function getOrderStatusLabel(value: string) {
	const status = ORDER_STATUSES.find(
		(orderStatus) => orderStatus.value === value,
	)
	return status?.label || value
}

export function getOrderStatusColor(value: string) {
	const status = ORDER_STATUSES.find(
		(orderStatus) => orderStatus.value === value,
	)
	return status?.color || 'default'
}
