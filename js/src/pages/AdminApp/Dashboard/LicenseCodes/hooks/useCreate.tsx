import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloudAxios } from '@/api'
import { NotificationInstance } from 'antd/es/notification/interface'
import { AxiosResponse } from 'axios'
import { DataType } from '../types'

type TUseCreateParams = {
	api: NotificationInstance
	close: () => void
}

export type TCreateParams = {
	quantity: number
	post_author?: number
	domain?: string
	product_slug?: string
	subscription_id?: number
	customer_id?: number
	limit_type?: 'unlimited' | 'fixed' | 'assigned'
	limit_value?: number | string
	limit_unit?: 'days' | 'months' | 'years' | ''
}

export type TCreateResponse = {
	code: string
	message: string
	data: {
		license_codes: DataType[]
	}
}

export const useCreate = ({ api, close }: TUseCreateParams) => {
	const queryClient = useQueryClient()
	const mutation = useMutation<
		AxiosResponse<TCreateResponse>,
		unknown,
		TCreateParams
	>({
		mutationFn: (data: TCreateParams) =>
			cloudAxios.post('/license-codes', data),
		onSuccess: (data) => {
			const message = data?.data?.message

			api.success({
				key: 'create-license-codes',
				message: '新增授權碼成功',
				description: message,
			})
			queryClient.invalidateQueries({ queryKey: ['license-codes'] })
			close()
		},
		onError: (err, values) => {
			console.log('⭐  err:', err)
			api.error({
				key: 'create-license-codes',
				message: '新增授權碼失敗',
			})
		},
	})
	return mutation
}
