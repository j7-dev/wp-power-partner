import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { NotificationInstance } from 'antd/es/notification/interface'
import { AxiosResponse } from 'axios'
import { kebab } from '@/utils'

type TUseUpdateParams = {
	api: NotificationInstance
	close: () => void
}

export type TUpdateParams = {
	ids: number[]
	post_status: string
	post_author?: number
	domain?: string
	product_slug?: string
	subscription_id?: number
	customer_id?: number
	limit_type?: 'unlimited' | 'fixed' | 'assigned'
	limit_value?: number | string
	limit_unit?: 'days' | 'months' | 'years' | ''
}

export type TUpdateResponse = {
	code: string
	message: string
	data: {
		ids: number[]
	}
}

export const useUpdate = ({ api, close }: TUseUpdateParams) => {
	const queryClient = useQueryClient()
	const mutation = useMutation<
		AxiosResponse<TUpdateResponse>,
		unknown,
		TUpdateParams
	>({
		mutationFn: (data: TUpdateParams) =>
			axios.post(`${kebab}/license-codes/update`, data),
		onSuccess: (data) => {
			const message = data?.data?.message

			api.success({
				key: 'update-license-codes',
				message: '更新授權碼成功',
				description: message,
			})
			queryClient.invalidateQueries({ queryKey: ['license-codes'] })
			close()
		},
		onError: (err, values) => {
			console.log('⭐  err:', err)
			api.error({
				key: 'update-license-codes',
				message: '更新授權碼失敗',
			})
		},
	})
	return mutation
}
