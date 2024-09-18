import React from 'react'
import { useTable, useModal } from '@/hooks'
import {
	Table,
	TableProps,
	Tag,
	Typography,
	Button,
	Modal,
	Form,
	Input,
	InputNumber,
	Select,
} from 'antd'
import { identityAtom } from '@/pages/AdminApp/atom'
import { useAtomValue } from 'jotai'
import { DataType, TParams, TStatus } from './types'
import { useRowSelection } from 'antd-toolkit'

const { Text } = Typography
const { Item } = Form
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
		dataIndex: 'license_code',
		render: (license_code: string) => (
			<Text className="font-mono" copyable>
				{license_code}
			</Text>
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
	},
	{
		title: '連接商品',
		dataIndex: 'product',
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
	const { modalProps, show } = useModal()
	const label = selectedRowKeys.length ? '修改' : '新增'
	const handleOk = () => {
		console.log('ok')
	}
	const [form] = Form.useForm()

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
			<Modal title={`批量${label}授權碼`} {...modalProps} onOk={handleOk}>
				<Form form={form} layout="vertical">
					<Item label="數量" name="amount">
						<InputNumber className="w-full" min={0} max={30} />
					</Item>
					<Item
						label="網域"
						name="domain"
						rules={[
							{
								pattern:
									/^([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.)?[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
								message: '請輸入有效的網域或子網域',
							},
						]}
					>
						<Input />
					</Item>
					<Item label="連接訂閱" name="subscription_id">
						<Input />
					</Item>
					<Item label="連接商品" name="product_id">
						<Input />
					</Item>
					<Item label="修改狀態" name="status">
						<Select>
							<Select.Option value="available">可用</Select.Option>
							<Select.Option value="activated">已啟用</Select.Option>
							<Select.Option value="deactivated">已停用</Select.Option>
							<Select.Option value="expired">已過期</Select.Option>
						</Select>
					</Item>
					<Item label="使用期限" name="expire_date">
						<Input />
					</Item>
				</Form>
			</Modal>
		</>
	)
}

export default index
