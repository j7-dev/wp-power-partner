import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { FormInstance, notification } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { LoadingOutlined } from '@ant-design/icons'

export type TFormValues = {
	power_partner_disable_site_after_n_days: number
	emails: DataType[]
}

const useSave = (form: FormInstance<TFormValues>) => {
	const queryClient = useQueryClient()
	const [api, contextHolder] = notification.useNotification({
		placement: 'bottomRight',
		stack: { threshold: 1 },
		duration: 10,
	})

	const mutation = useMutation({
		mutationFn: (values: TFormValues) =>
			axios.post('/power-partner/settings', values),
		onMutate: () => {
			api.open({
				key: 'save-settings',
				message: '儲存 設定 中...',
				duration: 0,
				icon: <LoadingOutlined className="text-primary" />,
			})
		},
		onError: (err) => {
			console.log('err', err)
			api.error({
				key: 'save-settings',
				message: 'OOPS! 儲存 設定 時發生問題',
			})
		},
		onSuccess: (data) => {
			const status = data?.data?.status
			const message = data?.data?.message

			if (200 === status) {
				api.success({
					key: 'save-settings',
					message: '儲存 設定 成功',
				})
				queryClient.invalidateQueries({ queryKey: ['emails'] })
			} else {
				api.error({
					key: 'save-settings',
					message: 'OOPS! 儲存 設定 時發生問題',
					description: message,
				})
			}
		},
	})

	return {
		contextHolder,
		mutation,
	}
}

export default useSave
