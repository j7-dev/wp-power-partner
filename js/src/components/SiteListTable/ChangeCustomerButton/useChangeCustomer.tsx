import { useState, useEffect } from 'react'
import { DataTypeWithSubscriptionIds as DataType } from '@/components/SiteListTable/types'
import { Button, Form } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { cloudAxios, axios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chosenRecordAtom } from '@/components/SiteListTable/atom'
import { useAtom } from 'jotai'
import { NotificationInstance } from 'antd/es/notification/interface'
import { kebab, partner_id } from '@/utils'

type TChangeCustomerParams = {
	site_id: string
	customer_id: string
	subscription_id?: string
	partner_id: string
	record: DataType | null
}

type TChangeSubscriptionParams = {
	site_id: string
	subscription_id?: string
	linked_site_ids?: string[]
	partner_id: string
	record: DataType | null
}

type TFormValues = {
	new_customer_id: string
	subscription_id: string
	linked_site_ids: string[] | undefined
}

type TUseChangeCustomerParams = {
	api: NotificationInstance
	containerRef: React.RefObject<HTMLDivElement>
}

export const useChangeCustomer = ({
	api,
	containerRef,
}: TUseChangeCustomerParams) => {
	const [form] = Form.useForm()
	const [chosenRecord, setChosenRecord] = useAtom(chosenRecordAtom)
	const [isModalOpen, setIsModalOpen] = useState(false)

	const queryClient = useQueryClient()

	const close = () => {
		setIsModalOpen(false)
	}

	const show = (record: DataType) => () => {
		setIsModalOpen(true)
		setChosenRecord(record)
	}

	const { mutate: changeCustomer, isPending: isPendingCC } = useMutation({
		mutationFn: (values: TChangeCustomerParams) => {
			const {
				record: _record,
				subscription_id: _subscription_id,
				...rest
			} = values
			return cloudAxios.post('/v2/change-customer', rest)
		},
		onMutate: (values) => {
			const { record, site_id, customer_id } = values
			setIsModalOpen(false)
			api.open({
				key: `loading-change-customer-${site_id}`,
				message: '客戶變更中...',
				description: `正在將 ${record?.wpapp_domain} 變更為 #${customer_id} 用戶 ...客戶變更有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。`,
				duration: 0,
				icon: <LoadingOutlined className="text-primary" />,
			})

			return record
		},
		onSuccess: (data, values) => {
			const { record, site_id, customer_id } = values
			const status = data?.data?.status

			if (200 === status) {
				api.success({
					key: `loading-change-customer-${site_id}`,
					message: '客戶變更成功',
					description: `${record?.wpapp_domain} 已成功變更為 #${customer_id} 用戶`,
				})
				queryClient.invalidateQueries({ queryKey: ['apps'] })
				close()
			} else {
				api.error({
					key: `loading-change-customer-${site_id}`,
					message: 'OOPS! 客戶變更時發生問題',
					description: `${record?.wpapp_domain} 已變更為 #${customer_id} 用戶 失敗， ${data?.data?.message}`,
				})
			}
		},
		onError: (err, values) => {
			const { record, site_id, customer_id } = values
			console.log('err', err)
			api.error({
				key: `loading-change-customer-${site_id}`,
				message: 'OOPS! 客戶變更時發生問題',
				description: `${record?.wpapp_domain} 已變更為 #${customer_id} 用戶 失敗`,
			})
		},
	})

	const { mutate: changeSubscription, isPending: isPendingCS } = useMutation({
		mutationFn: (values: TChangeSubscriptionParams) => {
			const { record: _record, ...rest } = values
			return axios.post(`/${kebab}/change-subscription`, rest)
		},
		onSuccess: (data, values) => {
			const { record, site_id, subscription_id } = values
			const status = data?.data?.status

			if (200 === status) {
				api.success({
					key: `loading-change-subscription-${site_id}`,
					message: '客戶變更成功',
					description: `${record?.wpapp_domain} 已綁定網站 #${site_id} 到訂閱 #${subscription_id} 成功`,
				})
				queryClient.invalidateQueries({ queryKey: ['get_partner_apps'] })
				close()
			} else {
				api.error({
					key: `loading-change-subscription-${site_id}`,
					message: 'OOPS! 綁定網站到訂閱時發生問題',
					description: `${record?.wpapp_domain} 已綁定網站 #${site_id} 到訂閱 #${subscription_id} 失敗`,
				})
			}
		},
		onError: (err, values) => {
			const { record, site_id, subscription_id } = values
			console.log('err', err)
			api.error({
				key: `loading-change-subscription-${site_id}`,
				message: 'OOPS! 綁定網站到訂閱時發生問題',
				description: `${record?.wpapp_domain} 已綁定網站 #${site_id} 到訂閱 #${subscription_id} 失敗`,
			})
		},
	})

	const handleChangeCustomer = () => {
		const customerId = chosenRecord?.customer_id
		form.validateFields().then((formValues: TFormValues) => {
			const subscription_id = formValues?.subscription_id
			if (customerId !== formValues?.new_customer_id) {
				changeCustomer({
					site_id: chosenRecord?.ID.toString() || '',
					customer_id: formValues?.new_customer_id,
					partner_id,
					record: chosenRecord,
				})
			}

			if (subscription_id) {
				changeSubscription({
					subscription_id,
					site_id: chosenRecord?.ID.toString() || '',
					linked_site_ids: formValues?.linked_site_ids,
					partner_id,
					record: chosenRecord,
				})
			}
		})
	}

	useEffect(() => {
		// 重開 Modal 時清空 input

		if (isModalOpen) {
			form.setFieldsValue({
				new_customer_id: undefined,
				subscription_id: undefined,
				linked_site_ids: undefined,
			})
		}
	}, [isModalOpen])

	const modalProps = {
		getContainer: containerRef.current as HTMLElement,
		centered: true,
		title: '變更客戶',
		open: isModalOpen,
		onCancel: close,
		footer: (
			<Button
				type="primary"
				danger
				onClick={handleChangeCustomer}
				className="mr-0"
				loading={isPendingCC || isPendingCS}
			>
				確認變更客戶
			</Button>
		),
	}

	return {
		show,
		close,
		modalProps,
		form,
	}
}
