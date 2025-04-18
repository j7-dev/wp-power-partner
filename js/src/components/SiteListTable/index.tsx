import { FC, useRef, memo } from 'react'
import { Table, TableProps, notification } from 'antd'
import { SystemInfo } from '@/components'
import {
	DataTypeWithSubscriptionIds as DataType,
	TGetCustomersResponse,
} from '@/components/SiteListTable/types'
import ToggleSslButton from '@/components/SiteListTable/ToggleSslButton'
import ToggleSiteButton from '@/components/SiteListTable/ToggleSiteButton'
import Customer from '@/components/SiteListTable/Customer'

import { BreathLight } from 'antd-toolkit'
import {
	ChangeDomainModal,
	ChangeDomainButton,
	useChangeDomain,
} from '@/components/SiteListTable/ChangeDomainButton'
import {
	ChangeCustomerModal,
	ChangeCustomerButton,
	useChangeCustomer,
} from '@/components/SiteListTable/ChangeCustomerButton'
import { UseQueryResult } from '@tanstack/react-query'
import { siteUrl } from '@/utils'

export * from './types'
export * from './useCustomers'
export * from './useApps'
export * from './useTable'

const SiteListTableComponent: FC<{
	tableProps: TableProps<DataType>
	customerResult: UseQueryResult<TGetCustomersResponse, Error>
	isAdmin?: boolean
}> = ({ tableProps, isAdmin = false, customerResult }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [api, contextHolder] = notification.useNotification({
		placement: 'bottomRight',
		stack: { threshold: 1 },
		duration: 10,
	})
	const {
		modalProps: modalPropsCD,
		show: showCD,
		form: formCD,
	} = useChangeDomain({
		api,
		containerRef,
	})

	const {
		modalProps: modalPropsCC,
		show: showCC,
		form: formCC,
	} = useChangeCustomer({
		api,
		containerRef,
	})
	const columns: TableProps<DataType>['columns'] = [
		{
			title: '網站名稱',
			dataIndex: 'post_title',
			render: (value: string, record) => (
				<>
					<p className="mb-1 mt-0 flex items-center gap-x-2">
						<BreathLight
							className={
								record?.wpapp_site_status !== 'off'
									? 'bg-[#84cc16]'
									: 'bg-[#f43f5e]'
							}
						/>

						<a
							target="_blank"
							href={`${
								record?.wpapp_ssl_status === 'on' ? 'https' : 'http'
							}://${record?.wpapp_domain}`}
							rel="noreferrer"
						>
							{value}
						</a>
					</p>
					{/* {record?.wpapp_site_status === 'off' ? (
            <Tag
              icon={<CloseCircleOutlined />}
              color="#f50"
              className="text-xs"
            >
              服務已停用
            </Tag>
          ) : (
            <Tag
              icon={<SyncOutlined spin />}
              color="#2db7f5"
              className="text-xs"
            >
              服務已啟用
            </Tag>
          )} */}
				</>
			),
		},
		{
			title: isAdmin ? '客戶資料' : '用戶資料',
			dataIndex: 'wpapp_user',
			render: (_: string, record) => (
				<Customer
					record={record}
					customerResult={customerResult}
					isAdmin={isAdmin}
				/>
			),
		},
		{
			title: '創建日期',
			dataIndex: 'post_date',
			render: (_: string, record) => {
				const subscription_ids = record?.subscription_ids || []
				const subscription_ids_node = subscription_ids.map((id) => (
					<a
						key={id}
						className="ml-2"
						href={`${siteUrl}/wp-admin/post.php?post=${id}&action=edit`}
						target="_blank"
						rel="noreferrer"
					>{`#${id}`}</a>
				))

				return (
					<div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
						<span className="bg-gray-200 px-2">創建</span>
						<span className="place-self-end">{record?.post_date}</span>
						<span className="bg-gray-200 px-2">上次變更</span>
						<span className="place-self-end">{record?.post_modified}</span>
						<span className="bg-gray-200 px-2">網站 id</span>
						<span className="place-self-end">#{record?.ID}</span>

						{isAdmin && (
							<>
								<span className="bg-gray-200 px-2">訂單編號</span>
								<span className="place-self-end">
									{record?.wpapp_wc_order_id
										? `#${record?.wpapp_wc_order_id}`
										: '-'}
								</span>
								<span className="bg-gray-200 px-2">對應訂閱</span>
								<span className="place-self-end">{subscription_ids_node}</span>
							</>
						)}
					</div>
				)
			},
		},
		{
			title: '系統資訊',
			dataIndex: 'wpapp_php_version',
			render: (_: string, record) => <SystemInfo record={record} />,
		},
		{
			title: '操作',
			dataIndex: 'actions',
			render: (_: string, record) => {
				return (
					<div className="flex gap-3">
						<ChangeDomainButton
							onClick={showCD(record)}
							containerRef={containerRef}
						/>
						{isAdmin && (
							<ChangeCustomerButton
								onClick={showCC(record)}
								containerRef={containerRef}
							/>
						)}
						<ToggleSslButton
							record={record}
							notificationApi={api}
							containerRef={containerRef}
						/>
						{isAdmin && (
							<ToggleSiteButton
								record={record}
								notificationApi={api}
								containerRef={containerRef}
							/>
						)}
					</div>
				)
			},
		},
	]
	return (
		<div ref={containerRef}>
			{contextHolder}
			<Table rowKey="ID" tableLayout="auto" columns={columns} {...tableProps} />
			<ChangeDomainModal modalProps={modalPropsCD} form={formCD} />
			{isAdmin && (
				<ChangeCustomerModal modalProps={modalPropsCC} form={formCC} />
			)}
		</div>
	)
}

export const SiteListTable = memo(SiteListTableComponent)
