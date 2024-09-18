import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { NotificationInstance } from 'antd/es/notification/interface'
import { AxiosResponse } from 'axios'
import { kebab } from '@/utils'

type TUseDeleteParams = {
	api: NotificationInstance
	close: () => void
	setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>
}

export type TDeleteParams = number[]

export type TDeleteResponse = {
	code: string
	message: string
	data: {
		success_ids: number[]
		failed_ids: number[]
	}
}

export const useDelete = ({
	api,
	close,
	setSelectedRowKeys,
}: TUseDeleteParams) => {
	const queryClient = useQueryClient()
	const mutation = useMutation<
		AxiosResponse<TDeleteResponse>,
		unknown,
		TDeleteParams
	>({
		mutationFn: (data: TDeleteParams) =>
			axios.delete(`${kebab}/license-codes`, { data: { ids: data } }),
		onSuccess: (data) => {
			const message = data?.data?.message

			api.success({
				key: 'delete-license-codes',
				message: '刪除授權碼成功',
				description: message,
			})
			queryClient.invalidateQueries({ queryKey: ['license-codes'] })
			setSelectedRowKeys([])
			close()
		},
		onError: (err, values) => {
			console.log('⭐  err:', err)
			api.error({
				key: 'delete-license-codes',
				message: '刪除授權碼失敗',
			})
		},
	})
	return mutation
}
