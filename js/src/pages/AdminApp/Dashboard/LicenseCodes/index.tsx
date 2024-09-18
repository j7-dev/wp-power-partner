import React from 'react'
import { useTable, useModal } from '@/hooks'
import { Table, TableProps, Tag, Typography, Button } from 'antd'
import { identityAtom } from '@/pages/AdminApp/atom'
import { useAtomValue } from 'jotai'
import { DataType, TParams, TStatus } from './types'
import { useRowSelection, DateTime } from 'antd-toolkit'
import { siteUrl } from '@/utils'
import ModalForm from './ModalForm'
import { getInfo } from './utils'

const { Text } = Typography

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
		color: 'magenta',
	},
	expired: {
		label: '已過期',
		color: 'default',
	},
}

const columns: TableProps<DataType>['columns'] = [
	{
		title: '授權碼',
		dataIndex: 'code',
		render: (code: string, record: DataType) => (
			<>
				<Text className="font-mono" copyable>
					{code}
				</Text>
				<p className="text-xs text-gray-500">id: #{record.id}</p>
			</>
		),
	},
	{
		title: '狀態',
		dataIndex: 'status',
		render: (status: TStatus) => (
			<Tag color={STATUS_MAP?.[status]?.color || 'default'}>
				{STATUS_MAP?.[status]?.label || '未定義狀態'}
			</Tag>
		),
	},
	{
		title: '期限',
		dataIndex: 'expire_date',
		render: (expire_date: number) =>
			expire_date ? <DateTime date={expire_date * 1000} /> : '無期限',
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
	{
		title: '連接訂閱',
		dataIndex: 'subscription_id',
		render: (subscription_id: number) =>
			subscription_id ? (
				<a
					href={`${siteUrl}/wp-admin/post.php?post=${subscription_id}&action=edit`}
					target="_blank"
					rel="noreferrer"
				>
					{subscription_id}
				</a>
			) : (
				''
			),
	},
	{
		title: '連接商品',
		dataIndex: 'product_name',
		render: (product_name: string) => product_name || 'N/A',
	},
	{
		title: '每天消耗點數',
		dataIndex: 'cost',
	},
]

const index = () => {
	const identity = useAtomValue(identityAtom)
	const user_id = identity.data?.user_id || ''
	const { tableProps } = useTable<TParams, DataType>({
		resource: 'license-codes',
		defaultParams: {
			author: user_id,
		},
		queryOptions: {
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		},
	})

	const { selectedRowKeys, rowSelection } = useRowSelection<DataType>()
	const { modalProps, show, close } = useModal()
	const { label, isSingleEdit } = getInfo(selectedRowKeys)
	const theSingleRecord = isSingleEdit
		? tableProps?.dataSource?.find(
				(record) => record.id === selectedRowKeys?.[0],
			)
		: undefined

	return (
		<>
			<Button type="primary" className="mb-4" onClick={show}>
				批量{label}
			</Button>
			<Table
				rowKey="id"
				tableLayout="auto"
				columns={columns}
				{...tableProps}
				rowSelection={rowSelection}
			/>
			<ModalForm
				selectedRowKeys={selectedRowKeys}
				modalProps={modalProps}
				close={close}
				theSingleRecord={theSingleRecord}
			/>
		</>
	)
}

export default index
