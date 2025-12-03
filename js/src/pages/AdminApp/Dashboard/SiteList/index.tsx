import {
	SiteListTable,
	useCustomers,
	useTable,
} from '@/components/SiteListTable'
import { powerCloudAxios, usePowerCloudAxiosWithApiKey } from '@/api'
import { identityAtom, globalLoadingAtom } from '@/pages/AdminApp/Atom/atom'
import {
	GlobalOutlined,
	CloudOutlined,
	LinkOutlined,
	SettingOutlined,
	ReloadOutlined,
	DeleteOutlined,
	StopOutlined,
	SyncOutlined,
} from '@ant-design/icons'
import {
	Tabs,
	TabsProps,
	Button,
	Table,
	Tag,
	Space,
	Tooltip,
	Typography,
	Spin,
	Empty,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
	EPowercloudIdentityStatusEnum,
	powercloudIdentityAtom,
} from '../../Atom/powercloud.atom'
import { TabKeyEnum, setTabAtom } from '../../Atom/tab.atom'

const { Text, Link } = Typography

// 網站狀態對應的顏色
const statusColorMap: Record<string, string> = {
	creating: 'processing',
	running: 'success',
	stopped: 'warning',
	deleting: 'error',
}

// 網站狀態對應的文字
const statusTextMap: Record<string, string> = {
	creating: '建置中',
	running: '運行中',
	stopped: '已停止',
	deleting: '刪除中',
}

interface IWebsite {
	id: string
	name: string
	domain: string
	namespace: string
	status: string
	isWildcard: boolean
	adminUsername: string
	adminEmail: string
	adminPassword: string
	databaseName: string
	databaseUsername: string
	databasePassword: string | null
	databaseRootPassword: string | null
	package: {
		id: string
		name: string
		description: string
		price: string
		wordpressSize: string
		mysqlSize: string
	} | null
	user: {
		id: string
		firstName: string
		lastName: string
		email: string
	} | null
	ipAddress: string
	createdAt: string
	updatedAt: string
}

interface IWebsiteResponse {
	data: IWebsite[]
	pagination: {
		total: number
		page: number
		limit: number
		totalPages: number
	}
}

const PowercloudContent = () => {
	const powerCloudInstance = usePowerCloudAxiosWithApiKey(powerCloudAxios)
	const [pagination, setPagination] = useState({ page: 1, limit: 10 })

	const { data, isLoading, refetch, isFetching } = useQuery({
		queryKey: ['powercloud-websites', pagination.page, pagination.limit],
		queryFn: () =>
			powerCloudInstance.get<IWebsiteResponse>(
				`/websites?page=${pagination.page}&limit=${pagination.limit}`,
			),
	})

	const { mutate: deleteWebsite } = useMutation({
		mutationFn: (id: string) => {
			return powerCloudInstance.delete(`/wordpress/${id}`)
		},
	})

	const websites = data?.data?.data || []
	const paginationInfo = data?.data?.pagination

	const columns: ColumnsType<IWebsite> = [
		{
			title: '網站名稱',
			dataIndex: 'name',
			key: 'name',
			ellipsis: true,
			width: 300,
			render: (name: string, record) => (
				<Space direction="vertical" size={0}>
					<Text strong ellipsis>
						{name}
					</Text>
					<Link
						href={`https://${record.domain}`}
						target="_blank"
						style={{ fontSize: 12 }}
					>
						<LinkOutlined /> {record.domain}
					</Link>
				</Space>
			),
		},
		{
			title: '狀態',
			dataIndex: 'status',
			key: 'status',
			render: (status: string) => (
				<Tag color={statusColorMap[status] || 'default'}>
					{statusTextMap[status] || status}
				</Tag>
			),
		},
		{
			title: '方案',
			dataIndex: 'package',
			key: 'package',
			render: (pkg: IWebsite['package']) =>
				pkg ? (
					<Space direction="vertical" size={0}>
						<Text>{pkg.name}</Text>
						<Text type="secondary" style={{ fontSize: 12 }}>
							NT$ {pkg.price}/年
						</Text>
					</Space>
				) : (
					<Text type="secondary">-</Text>
				),
		},
		{
			title: '管理員信箱',
			dataIndex: 'adminEmail',
			key: 'adminEmail',
			ellipsis: true,
			width: 300,
			render: (email: string) => (
				<Text copyable ellipsis>
					{email}
				</Text>
			),
		},
		{
			title: '管理員密碼',
			key: 'adminPassword',
			render: (_, record) => (
				<Text copyable={{ text: record.adminPassword }}>••••••••</Text>
			),
		},
		{
			title: 'IP 位址',
			dataIndex: 'ipAddress',
			key: 'ipAddress',
			render: (ipAddress: string) => (
				<Text copyable={{ text: ipAddress }}>{ipAddress}</Text>
			),
		},
		{
			title: '建立時間',
			dataIndex: 'createdAt',
			key: 'createdAt',
			render: (date: string) => (
				<Text type="secondary">
					{new Date(date).toLocaleString('zh-TW', {
						year: 'numeric',
						month: '2-digit',
						day: '2-digit',
						hour: '2-digit',
						minute: '2-digit',
					})}
				</Text>
			),
		},
		{
			title: '操作',
			key: 'actions',
			fixed: 'right',
			render: (_, record) => {
				console.log('record', record)
				return (
					<Space>
						<Tooltip title="前往後台">
							<Button
								type="link"
								size="small"
								icon={<SettingOutlined />}
								href={`https://${record.domain}/wp-admin`}
								target="_blank"
							/>
						</Tooltip>
						{record.status !== 'creating' && (
							<Tooltip title="刪除站台">
								<Button
									type="link"
									size="small"
									danger
									icon={<DeleteOutlined />}
									onClick={() => handleDelete(record.id)}
								/>
							</Tooltip>
						)}

						{record.status === 'running' && (
							<Tooltip title="停止站台">
								<Button
									type="link"
									size="small"
									danger
									icon={<StopOutlined />}
									onClick={() => handleStop(record.id)}
								/>
							</Tooltip>
						)}
						{record.status === 'stopped' && (
							<Tooltip title="啟動站台">
								<Button
									type="link"
									size="small"
									icon={<SyncOutlined />}
									onClick={() => handleStart(record.id)}
									className="animate-spin"
								/>
							</Tooltip>
						)}
					</Space>
				)
			},
		},
	]

	const handleDelete = (id: string) => {
		deleteWebsite(id)
	}

	const handleStop = (id: string) => {
		console.log(id)
	}

	const handleStart = (id: string) => {
		console.log(id)
	}

	if (isLoading) {
		return (
			<div style={{ textAlign: 'center', padding: '60px 0' }}>
				<Spin size="large" />
				<div style={{ marginTop: 16 }}>
					<Text type="secondary">載入網站列表中...</Text>
				</div>
			</div>
		)
	}

	if (!websites.length) {
		return (
			<Empty description="尚無網站資料" style={{ padding: '60px 0' }}>
				<Text type="secondary">請前往「手動開站」建立您的第一個網站</Text>
			</Empty>
		)
	}

	return (
		<div>
			<div
				style={{
					marginBottom: 16,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<Text type="secondary">共 {paginationInfo?.total || 0} 個網站</Text>
				<Button
					icon={<ReloadOutlined spin={isFetching} />}
					onClick={() => refetch()}
					loading={isFetching}
				>
					重新整理
				</Button>
			</div>
			<Table
				columns={columns}
				dataSource={websites}
				rowKey="id"
				loading={isFetching}
				scroll={{ x: 1000 }}
				pagination={{
					current: pagination.page,
					pageSize: pagination.limit,
					total: paginationInfo?.total || 0,
					showSizeChanger: true,
					showQuickJumper: true,
					pageSizeOptions: ['10', '20', '50'],
					showTotal: (total, range) =>
						`第 ${range[0]}-${range[1]} 筆，共 ${total} 筆`,
					onChange: (page, pageSize) => {
						setPagination({ page, limit: pageSize })
					},
				}}
			/>
		</div>
	)
}

const Powercloud = () => {
	const powercloudIdentity = useAtomValue(powercloudIdentityAtom)
	const setTab = useSetAtom(setTabAtom)

	const handleRedirectToPowercloudAuth = () =>
		setTab(TabKeyEnum.POWERCLOUD_AUTH)

	if (
		powercloudIdentity.status !== EPowercloudIdentityStatusEnum.LOGGED_IN ||
		!powercloudIdentity.apiKey
	) {
		return (
			<Button variant="link" danger onClick={handleRedirectToPowercloudAuth}>
				登入新架構
			</Button>
		)
	}
	return <PowercloudContent />
}

const WPCD = () => {
	const identity = useAtomValue(identityAtom)
	const setGlobalLoading = useSetAtom(globalLoadingAtom)

	const user_id = identity.data?.user_id || ''

	const { tableProps } = useTable({
		resource: 'apps',
		defaultParams: {
			user_id,
			offset: 0,
			numberposts: 10,
		},
		queryOptions: {
			enabled: !!user_id,
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		},
	})

	// 取得所有網站的 customer 資料

	const all_customer_ids =
		tableProps?.dataSource
			?.map((site) => site.customer_id)
			.filter((value, i, self) => self.indexOf(value) === i) || [] // remove duplicates

	const customerResult = useCustomers({ user_ids: all_customer_ids })

	useEffect(() => {
		if (!tableProps?.loading) {
			setGlobalLoading({
				isLoading: false,
				label: '',
			})
		}
	}, [tableProps?.loading])

	return (
		<SiteListTable
			tableProps={tableProps}
			customerResult={customerResult}
			isAdmin
		/>
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
