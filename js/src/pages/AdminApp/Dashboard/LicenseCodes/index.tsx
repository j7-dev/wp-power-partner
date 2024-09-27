import React, { useState, useRef, useMemo } from 'react'
import { useTable, useModal } from '@/hooks'
import {
	Table,
	TableProps,
	Tag,
	Typography,
	Button,
	Popconfirm,
	notification,
	Input,
} from 'antd'
import { identityAtom } from '@/pages/AdminApp/atom'
import { useAtomValue } from 'jotai'
import { DataType, TParams, TStatus } from './types'
import { useRowSelection } from 'antd-toolkit'
import { siteUrl, currentUserId } from '@/utils'
import ModalForm from './ModalForm'
import { getInfo } from './utils'
import { useDelete } from './hooks'
import { CreateModifyTime } from '@/components'
import { SyncOutlined, UserOutlined } from '@ant-design/icons'
import ExpireDate from './ExpireDate'
import { useRelease, useSubscriptionsNextPayment } from './hooks'

const { Text } = Typography
const { Search } = Input

const STATUS_MAP = {
	available: {
		label: '可用',
		color: 'processing',
	},
	activated: {
		label: '已啟用',
		color: 'green',
	},
	deactivated: {
		label: '已停用',
		color: 'default',
	},
	expired: {
		label: '已過期',
		color: 'magenta',
	},
}

const index = ({ isAdmin = false }: { isAdmin?: boolean }) => {
	const identity = useAtomValue(identityAtom)
	const containerRef = useRef<HTMLDivElement | null>(null)
	const [search, setSearch] = useState('')
	const user_id = identity.data?.user_id || ''
	const { tableProps } = useTable<TParams, DataType>({
		resource: 'license-codes',
		defaultParams: {
			author: user_id,
			customer_id: isAdmin ? undefined : currentUserId,
			search,
		},
		queryOptions: {
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		},
	})

	const { selectedRowKeys, rowSelection, setSelectedRowKeys } =
		useRowSelection<DataType>()
	const useModalResult = useModal()
	const { show, close } = useModalResult
	const { label, isEdit, isCreate } = getInfo(selectedRowKeys)
	const theSingleRecord = isEdit
		? tableProps?.dataSource?.find(
				(record) => record.id === selectedRowKeys?.[0],
			)
		: undefined

	const [api, contextHolder] = notification.useNotification()
	const { mutate: deleteLCs, isPending: isDeleting } = useDelete({
		api,
		close,
		setSelectedRowKeys,
	})
	const handleDelete = () => {
		deleteLCs(selectedRowKeys as number[])
	}

	const { mutate: release, isPending: isReleasing } = useRelease({ api })

	const handleRelease = () => {
		release({
			ids: selectedRowKeys as number[],
			customer_id: isAdmin ? undefined : currentUserId,
		})
	}

	const subscription_ids =
		tableProps?.dataSource?.map((record) => record.subscription_id) || []
	const nextPayments = useSubscriptionsNextPayment({ subscription_ids })

	const columns: TableProps<DataType>['columns'] = useMemo(() => {
		const adminColumns: TableProps<DataType>['columns'] = isAdmin
			? [
					{
						title: '每天消耗點數',
						dataIndex: 'rate',
					},
					{
						title: '建立/修改時間',
						dataIndex: 'post_date',
						render: (post_date: string, { post_modified }: DataType) => (
							<CreateModifyTime created={post_date} modified={post_modified} />
						),
					},
				]
			: []

		return [
			{
				title: '商品',
				dataIndex: 'product_name',
				render: (product_name: string) => product_name || 'N/A',
			},
			{
				title: '授權碼',
				dataIndex: 'code',
				render: (code: string, record: DataType) => (
					<>
						<Text className="font-mono" copyable>
							{code}
						</Text>
						{isAdmin && (
							<p className="text-xs text-gray-500">id: #{record.id}</p>
						)}
					</>
				),
			},
			{
				title: '狀態',
				dataIndex: 'post_status',
				render: (post_status: TStatus) => (
					<Tag color={STATUS_MAP?.[post_status]?.color || 'default'}>
						{STATUS_MAP?.[post_status]?.label || '未定義狀態'}
					</Tag>
				),
			},
			{
				title: '期限',
				dataIndex: 'expire_date',
				render: (_: number, record) => (
					<ExpireDate record={record} nextPayments={nextPayments} />
				),
			},
			{
				title: '管理訂閱',
				dataIndex: 'subscription_id',
				render: (subscription_id: number, { customer_id }: DataType) =>
					subscription_id ? (
						<>
							<a
								href={
									isAdmin
										? `${siteUrl}/wp-admin/post.php?post=${subscription_id}&action=edit`
										: `${siteUrl}/my-account/view-subscription/${subscription_id}`
								}
								target="_blank"
								rel="noreferrer"
								className="block text-xs"
							>
								<SyncOutlined className="mr-1" />#{subscription_id}
							</a>
							{isAdmin && (
								<a
									href={`${siteUrl}/wp-admin/user-edit.php?user_id=${customer_id}&wp_http_referer=%2Fwp-admin%2Fusers.php`}
									target="_blank"
									rel="noreferrer"
									className="block text-xs"
								>
									<UserOutlined className="mr-1" />#{customer_id}
								</a>
							)}
						</>
					) : (
						''
					),
			},
			{
				title: '綁定網域',
				dataIndex: 'domain',
				render: (domain: string) => (
					<a href={`https://${domain}`} target="_blank" rel="noreferrer">
						{domain}
					</a>
				),
			},
			...adminColumns,
		]
	}, [isAdmin, nextPayments])

	return (
		<div ref={containerRef}>
			{contextHolder}
			<div className={`flex mb-4  ${isAdmin ? 'justify-between' : ''}`}>
				{isAdmin && (
					<Button type="primary" onClick={show}>
						批量{label}
						{isEdit ? ` (${selectedRowKeys.length})` : ''}
					</Button>
				)}

				<div className="flex gap-x-4">
					<Popconfirm
						title="確認解除網域榜定嗎?"
						description="只有 [已啟用] 的授權碼可以解除網域榜定"
						onConfirm={handleRelease}
						okText="確認"
						cancelText="取消"
						getPopupContainer={() =>
							(containerRef?.current || document.body) as HTMLElement
						}
					>
						<Button type="primary" disabled={isCreate} loading={isReleasing}>
							批量解除網域榜定{isCreate ? '' : ` (${selectedRowKeys.length})`}
						</Button>
					</Popconfirm>
					{isAdmin && (
						<Popconfirm
							title="確認刪除嗎?"
							onConfirm={handleDelete}
							okText="確認"
							cancelText="取消"
							getPopupContainer={() =>
								(containerRef?.current || document.body) as HTMLElement
							}
						>
							<Button
								type="primary"
								danger
								disabled={isCreate}
								loading={isDeleting}
							>
								批量刪除{isCreate ? '' : ` (${selectedRowKeys.length})`}
							</Button>
						</Popconfirm>
					)}
				</div>
			</div>
			<div className="mb-4">
				<Search
					placeholder="搜尋授權碼 / ID"
					onSearch={setSearch}
					enterButton
					allowClear
					className="w-[20rem]"
				/>
			</div>
			<Table
				rowKey="id"
				tableLayout="auto"
				columns={columns}
				{...tableProps}
				rowSelection={rowSelection}
			/>
			{isAdmin && (
				<ModalForm
					containerRef={containerRef}
					selectedRowKeys={selectedRowKeys}
					useModalResult={useModalResult}
					theSingleRecord={theSingleRecord}
					notificationInstance={api}
				/>
			)}
		</div>
	)
}

export default index
