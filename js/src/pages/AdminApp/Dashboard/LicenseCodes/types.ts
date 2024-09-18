export type TStatus = 'available' | 'activated' | 'deactivated' | 'expired'

export type DataType = {
	id: number
	status: TStatus
	code: string
	is_subscription: boolean
	subscription_id: number
	expire_date: number
	domain: string
	product_slug: string
	product_name: string

}

export type TParams = {
	author: string | number
}
