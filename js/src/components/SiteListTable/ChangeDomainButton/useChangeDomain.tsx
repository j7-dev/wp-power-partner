import { useState, useEffect } from 'react'
import { DataTypeWithSubscriptionIds as DataType } from '@/components/SiteListTable/types'
import { Button, Form } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { cloudAxios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { chosenRecordAtom } from '@/components/SiteListTable/atom'
import { useAtom } from 'jotai'
import { NotificationInstance } from 'antd/es/notification/interface'

type TChangeDomainParams = {
	id: string
	new_domain: string
	record: DataType | null
}

type TFormValues = {
	new_domain: string
}

type TUseChangeDomainParams = {
	api: NotificationInstance
	containerRef: React.RefObject<HTMLDivElement>
}

export const useChangeDomain = ({
	api,
	containerRef,
}: TUseChangeDomainParams) => {
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

	const { mutate: changeDomain } = useMutation({
		mutationFn: (values: TChangeDomainParams) => {
			const { record: _, ...rest } = values
			return cloudAxios.post('/change-domain', rest)
		},
		onMutate: (values) => {
			const { record, id, new_domain } = values
			setIsModalOpen(false)
			api.open({
				key: `loading-change-domain-${id}`,
				message: '域名變更中...',
				description: `正在將 ${record?.wpapp_domain} 變更為 ${new_domain} ...網域變更有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。`,
				duration: 0,
				icon: <LoadingOutlined className="text-primary" />,
			})

			return record
		},
		onSuccess: (data, values) => {
			const { record, id, new_domain } = values
			const status = data?.data?.status

			if (200 === status) {
				api.success({
					key: `loading-change-domain-${id}`,
					message: '域名變更成功',
					description: `${record?.wpapp_domain} 已成功變更為 ${new_domain}`,
				})
				queryClient.invalidateQueries({ queryKey: ['apps'] })
			} else {
				api.error({
					key: `loading-change-domain-${id}`,
					message: 'OOPS! 域名變更時發生問題',
					description: `${record?.wpapp_domain} 已變更為 ${new_domain} 失敗， ${data?.data?.message}`,
				})
			}
		},
		onError: (err, values) => {
			const { record, id, new_domain } = values
			console.log('err', err)
			api.error({
				key: `loading-change-domain-${id}`,
				message: 'OOPS! 域名變更時發生問題',
				description: `${record?.wpapp_domain} 已變更為 ${new_domain} 失敗`,
			})
		},
	})

	const handleChangeDomain = () => {
		form.validateFields().then((formValues: TFormValues) => {
			changeDomain({
				id: chosenRecord?.ID.toString() || '',
				new_domain: formValues?.new_domain,
				record: chosenRecord,
			})
		})
	}

	useEffect(() => {
		// 重開 Modal 時清空 input

		if (isModalOpen) {
			form.setFieldsValue({
				new_domain: '',
			})
		}
	}, [isModalOpen])

	useEffect(() => {
		form.setFieldsValue({
			current_domain: chosenRecord?.wpapp_domain,
		})
	}, [chosenRecord?.wpapp_domain])

	const modalProps = {
		getContainer: containerRef.current as HTMLElement,
		centered: true,
		title: '變更域名 ( domain name )',
		open: isModalOpen,
		onCancel: close,
		footer: (
			<Button
				type="primary"
				danger
				onClick={handleChangeDomain}
				className="mr-0"
			>
				確認變更域名 ( domain name )
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
