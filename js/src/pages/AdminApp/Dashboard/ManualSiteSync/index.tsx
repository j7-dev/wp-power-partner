import React, { useRef } from 'react'
import {
	allowed_template_options,
	host_positions,
	kebab,
	is_kiwissec,
} from '@/utils'
import { Select, Form, Button, notification, Tabs } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import {
	CloudOutlined,
	GlobalOutlined,
	LoadingOutlined,
} from '@ant-design/icons'
import { identityAtom } from '@/pages/AdminApp/Atom/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { TabsProps } from 'antd/lib'
import {
	EPowercloudIdentityStatusEnum,
	powercloudIdentityAtom,
} from '../../Atom/powercloud.atom'
import { TabKeyEnum, setTabAtom } from '../../Atom/tab.atom'

const { Item } = Form

type TManualSiteSyncParams = {
	site_id: string
	host_position: string
}

const Powercloud = () => {
	const powercloudIdentity = useAtomValue(powercloudIdentityAtom)
	const setTab = useSetAtom(setTabAtom)

	const handleRedirectToPowercloudAuth = () => setTab(TabKeyEnum.POWERCLOUD_AUTH)

	if (powercloudIdentity.status !== EPowercloudIdentityStatusEnum.LOGGED_IN || !powercloudIdentity.apiKey) {
		return (<Button variant='link' danger onClick={handleRedirectToPowercloudAuth}>登入新架構</Button>)
	}
	return 'powercloud content'
}

const WPCD = () => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [form] = Form.useForm()
	const [api, contextHolder] = notification.useNotification({
		placement: 'bottomRight',
		stack: { threshold: 1 },
		duration: 10,
	})
	const identity = useAtomValue(identityAtom)

	const queryClient = useQueryClient()

	const { mutate: siteSync, isPending: isPendingSiteSync } = useMutation({
		mutationFn: (params: TManualSiteSyncParams) => {
			return axios.post(`/${kebab}/manual-site-sync`, params)
		},
		onMutate: () => {
			api.open({
				key: 'manual-site-sync',
				message: '正在發送開站請求至站長路可伺服器...',
				description:
					'正在發送請求中...有可能需要等待 🕙 30 秒 ~ 1 分鐘左右的時間，請先不要關閉視窗🙏',
				duration: 0,
				icon: <LoadingOutlined className="text-primary" />,
			})
		},
		onError: (err) => {
			console.log('err', err)
			api.error({
				key: 'manual-site-sync',
				message: 'OOPS! 開站時發生問題',
			})
		},
		onSuccess: (data) => {
			const status = data?.data?.status
			const message = data?.data?.message
			const email = identity?.data?.email || ''

			if (200 === status) {
				api.success({
					key: 'manual-site-sync',
					message: '已經收到您的開站請求',
					description: (
						<>
							站長路可伺服器正在處理您的請求，大約等待 🕙 5 ~ 10
							分鐘左右，開站完成後會將相關資訊寄送到您信箱 {email}`
						</>
					),
					duration: 0,
				})
				queryClient.invalidateQueries({ queryKey: ['apps'] })
			} else {
				api.error({
					key: 'manual-site-sync',
					message: 'OOPS! 開站時發生問題',
					description: message,
				})
			}
		},
	})

	const handleFinish = () => {
		const values: TManualSiteSyncParams = form.getFieldsValue()
		siteSync(values)
	}

	// clear cache

	const { mutate: mutateClearCache, isPending: isPendingClearCache } =
		useMutation({
			mutationFn: () => {
				return axios.post(`/${kebab}/clear-template-sites-cache`)
			},
			onMutate: () => {
				api.open({
					key: 'clear-template-sites-cache',
					message: '正在清除模板站快取...',
					duration: 0,
					icon: <LoadingOutlined className="text-primary" />,
				})
			},
			onError: (err) => {
				console.log('err', err)
				api.error({
					key: 'clear-template-sites-cache',
					message: 'OOPS! 清除模板站快取時發生問題',
				})
			},
			onSuccess: (data) => {
				const status = data?.data?.status
				const message = data?.data?.message

				if (200 === status) {
					api.success({
						key: 'clear-template-sites-cache',
						message: '已經清除模板站快取，3 秒後將重新整理頁面',
					})

					// refresh page

					setTimeout(() => {
						window.location.reload()
					}, 3000)
				} else {
					api.error({
						key: 'clear-template-sites-cache',
						message: 'OOPS! 清除模板站快取時發生問題',
						description: message,
					})
				}
			},
		})

	const handleClearCache = () => {
		mutateClearCache()
	}

	const isPending = isPendingSiteSync || isPendingClearCache

	return (
		<div ref={containerRef}>
			<Form
				form={form}
				className="mt-8"
				layout="vertical"
				labelCol={{ span: 8 }}
				wrapperCol={{ span: 16 }}
				style={{ maxWidth: 600 }}
			>
				{contextHolder}
				<Item
					label="選擇開站模板"
					name={['site_id']}
					rules={[
						{
							required: true,
							message: '請選擇開站模板',
						},
					]}
				>
					<Select
						options={Object.keys(allowed_template_options).map((key) => ({
							label: allowed_template_options?.[key],
							value: key,
						}))}
						allowClear
						disabled={isPending}
						getPopupContainer={() => containerRef.current as HTMLElement}
					/>
				</Item>
				<Item
					label="選擇主機種類"
					name={['host_position']}
					initialValue="jp"
					rules={[
						{
							required: true,
							message: '請選擇主機種類',
						},
					]}
				>
					<Select
						options={
							is_kiwissec
								? [
										...host_positions,
										{
											value: 'kiwissec',
											label: '七維思',
										},
									]
								: host_positions
						}
						allowClear
						disabled={isPending}
						getPopupContainer={() => containerRef.current as HTMLElement}
					/>
				</Item>

				<div className="flex gap-x-2 mt-12">
					<Button type="primary" loading={isPending} onClick={handleFinish}>
						開站
					</Button>

					<Button
						type="default"
						htmlType="button"
						className="ml-2"
						onClick={handleClearCache}
					>
						清除快取
					</Button>
				</div>
			</Form>
		</div>
	)
}

const siteTypeItems: TabsProps['items'] = [
	{
		key: 'wpcd',
		icon: <GlobalOutlined />,
		label: '舊架構',
		children: <WPCD />,
		forceRender: false,
	},
	{
		key: 'powercloud',
		icon: <CloudOutlined />,
		label: '新架構',
		children: <Powercloud />,
		forceRender: false,
	},
]

const index = () => {
	return <Tabs items={siteTypeItems} />
}

export default index
