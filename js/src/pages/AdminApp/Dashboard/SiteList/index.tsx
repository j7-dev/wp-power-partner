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
	Popconfirm,
	InputNumber,
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
	phpPodSize: number
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

// 容器數量編輯組件
const PodSizeEditor = ({
	initialValue,
	domain,
	packagePrice,
	onUpdate,
}: {
	initialValue: number
	domain: string
	packagePrice?: string
	onUpdate: (value: number) => void
}) => {
	const [value, setValue] = useState(initialValue)

	const dailyCostPerPod = +(+(packagePrice ?? 0) / 365).toFixed(2)
	const dailyCost = +(dailyCostPerPod * (1 + 0.6 * (value - 1))).toFixed(2)

	useEffect(()=> {
		setValue(initialValue)
	}, [initialValue])

	return (
		<div className="flex gap-2 items-center">
			<InputNumber
				min={1}
				max={10}
				value={value}
				onChange={(v) => setValue(v ?? 1)}
				size="small"
			/>
			<Tooltip title="更新容器數量">
				<Popconfirm
					title="確認更新容器數量"
					description={
						<div className="flex flex-col gap-1">
							<div>確定要將站台 <strong>{domain}</strong> 的容器數量更新為 <strong>{value}</strong> 個嗎？</div>
							<div className="mt-2 text-xs text-gray-500">
								<div>計算公式：每日扣款價格 X 1 + 每日扣款價格 X 額外容器數量 X 0.6</div>
								<div>= {dailyCostPerPod} X 1 + {dailyCostPerPod} X ({value} - 1) X 0.6</div>
								<div>= NT$ {dailyCost}/日</div>
							</div>
							<div className="mt-2 font-medium">每日預計扣款：<span className="text-blue-600">NT$ {dailyCost}/日</span></div>
						</div>
					}
					onConfirm={() => onUpdate(value)}
					okText="確認更新"
					cancelText="取消"
				>
					<Button type="link" size="small" icon={<SyncOutlined />} />
				</Popconfirm>
			</Tooltip>
		</div>
	)
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

	const { mutate: startWebsite } = useMutation({
		mutationFn: (id: string) => {
			return powerCloudInstance.patch(`/wordpress/${id}/start`)
		},
	})

	const { mutate: stopWebsite } = useMutation({
		mutationFn: (id: string) => {
			return powerCloudInstance.patch(`/wordpress/${id}/stop`)
		},
	})

	const { mutate: updatePodSize } = useMutation({
		mutationFn: ({ id, phpPodSize }: { id: string; phpPodSize: number }) => {
			return powerCloudInstance.patch(`/wordpress/${id}/pod-size`, { phpPodSize })
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
			title: '每日扣款',
			dataIndex: 'dailyCost',
			key: 'dailyCost',
			render: (dailyCost: number) => {
				return <Text>NT$ {dailyCost}/日</Text>
			},
		},
		{
			title: '容器數量',
			dataIndex: 'phpPodSize',
			key: 'phpPodSize',
			render: (phpPodSize: number, record) => (
				<PodSizeEditor
					initialValue={phpPodSize ?? 1}
					domain={record.domain}
					packagePrice={record.package?.price}
					onUpdate={(value) => handlePodSizeChange(record.id, value)}
				/>
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
						{record.status === 'stopped' && (
							<Popconfirm
								title="確認啟動站台"
								description={`確定要啟動站台 ${record.domain} 嗎？`}
								onConfirm={() => handleStart(record.id)}
								okText="確認啟動"
								cancelText="取消"
							>
								<Tooltip title="啟動站台">
									<Button type="link" size="small" icon={<SyncOutlined />} />
								</Tooltip>
							</Popconfirm>
						)}
						{record.status === 'running' && (
							<Popconfirm
								title="確認停止站台"
								description={`確定要停止站台 ${record.domain} 嗎？`}
								onConfirm={() => handleStop(record.id)}
								okText="確認停止"
								cancelText="取消"
								okButtonProps={{ danger: true }}
							>
								<Tooltip title="停止站台">
									<Button
										type="link"
										size="small"
										danger
										icon={<StopOutlined />}
									/>
								</Tooltip>
							</Popconfirm>
						)}
						{record.status !== 'creating' && (
							<Popconfirm
								title="確認刪除站台"
								description={`確定要刪除站台 ${record.domain} 嗎？此操作無法復原。`}
								onConfirm={() => handleDelete(record.id)}
								okText="確認刪除"
								cancelText="取消"
								okButtonProps={{ danger: true }}
							>
								<Tooltip title="刪除站台">
									<Button
										type="link"
										size="small"
										danger
										icon={<DeleteOutlined />}
									/>
								</Tooltip>
							</Popconfirm>
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
		stopWebsite(id)
	}

	const handleStart = (id: string) => {
		startWebsite(id)
	}

	const handlePodSizeChange = (id: string, value: number) => {
		updatePodSize({ id, phpPodSize: value })
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
