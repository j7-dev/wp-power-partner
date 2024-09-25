import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cloudAxios } from '@/api'
import { NotificationInstance } from 'antd/es/notification/interface'
import { AxiosResponse } from 'axios'

type TUseReleaseParams = {
	api: NotificationInstance
}

export type TReleaseParams = {
	ids: number[]
	customer_id?: number
}

export type TReleaseResponse = {
	code: string
	message: string
	data: {
		ids: number[]
	}
}

/**
 * 解除網域綁定
 */
export const useRelease = ({ api }: TUseReleaseParams) => {
	const queryClient = useQueryClient()
	const mutation = useMutation<
		AxiosResponse<TReleaseResponse>,
		unknown,
		TReleaseParams
	>({
		mutationFn: (data: TReleaseParams) =>
			cloudAxios.post(`license-codes/release`, data),
		onSuccess: (data) => {
			const message = data?.data?.message

			api.success({
				key: 'release-license-codes',
				message: '解除網域綁定授權碼成功',
				description: message,
			})
			queryClient.invalidateQueries({ queryKey: ['license-codes'] })
		},
	})
	return mutation
}
