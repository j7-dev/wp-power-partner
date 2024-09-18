export type TStatus = 'available' | 'activated' | 'deactivated' | 'expired'

export type DataType = {
	id: number
	license_code: string
	expire_date: number
	domain: string
	product: string
	status: TStatus
}

export type TParams = {
	author: string | number
}
