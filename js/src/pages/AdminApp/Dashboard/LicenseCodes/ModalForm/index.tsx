import React, { FC, useEffect } from 'react'

import {
	Modal,
	Form,
	Input,
	InputNumber,
	Select,
	ModalProps,
	DatePicker,
	Switch,
	Tag,
	notification,
} from 'antd'
import { getInfo } from '../utils'
import { useProducts, useCreate, TCreateParams } from '../hooks'
import { DataType } from '../types'
import dayjs from 'dayjs'

const { Item } = Form

const index: FC<{
	selectedRowKeys: React.Key[]
	modalProps: ModalProps
	close: () => void
	theSingleRecord: DataType | undefined
}> = ({ selectedRowKeys, modalProps, close, theSingleRecord }) => {
	const [api, contextHolder] = notification.useNotification()
	const { label, isEdit } = getInfo(selectedRowKeys)

	const { mutate: create, isPending: isCreating } = useCreate({ api, close })
	const handleOk = () => {
		const values = form.getFieldsValue()
		const formattedValues: TCreateParams = {
			...values,
			is_subscription: undefined,
			status: undefined,
		}
		create(formattedValues)
	}
	const [form] = Form.useForm()

	const productOptions = useProducts()
	const watchIsSubscription = Form.useWatch(['is_subscription'], form)
	const watchLimitType = Form.useWatch(['limit_type'], form)

	useEffect(() => {
		if (isEdit) {
			return
		}
		if ('unlimited' === watchLimitType) {
			form.setFieldValue(['limit_value'], '')
			form.setFieldValue(['limit_unit'], '')
		}
		if ('fixed' === watchLimitType) {
			form.setFieldValue(['limit_value'], 1)
			form.setFieldValue(['limit_unit'], 'days')
		}
		if ('assigned' === watchLimitType) {
			form.setFieldValue(['limit_value'], dayjs().format('YYYY-MM-DD'))
			form.setFieldValue(['limit_unit'], '')
		}
	}, [watchLimitType, isEdit])

	useEffect(() => {
		if (!theSingleRecord) {
			return
		}
		form.setFieldsValue(theSingleRecord)
	}, [theSingleRecord])

	return (
		<Modal
			title={`批量${label}授權碼 ${isEdit ? `(${selectedRowKeys.length}) 筆` : ''}`}
			{...modalProps}
			onOk={handleOk}
			confirmLoading={isCreating}
		>
			{contextHolder}
			{!!isEdit && (
				<div>
					{selectedRowKeys.map((key) => (
						<Tag key={key}>#{key as string}</Tag>
					))}
				</div>
			)}
			<Form form={form} layout="vertical" className="mt-8">
				<div className="flex gap-x-4">
					{!!isEdit && (
						<Item label="修改狀態" name={['status']} initialValue="available">
							<Select className="!w-40">
								<Select.Option value="available">可用</Select.Option>
								{/* <Select.Option value="activated">已啟用</Select.Option> */}
								<Select.Option value="deactivated">已停用</Select.Option>
								{/* <Select.Option value="expired">已過期</Select.Option> */}
							</Select>
						</Item>
					)}
					<Item
						label="連接商品"
						name={['product_slug']}
						initialValue={productOptions?.[0]?.value}
					>
						<Select className="!w-40" options={productOptions} />
					</Item>
					<Item label="數量" name={['quantity']} initialValue={1}>
						<InputNumber className="w-full" min={1} max={30} />
					</Item>
				</div>

				<Item
					label="綁訂訂閱"
					name={['is_subscription']}
					initialValue={false}
					valuePropName="checked"
					tooltip="綁訂訂閱後，授權碼狀態將跟自動隨訂閱狀態調整"
				>
					<Switch />
				</Item>

				{!!watchIsSubscription && (
					<Item label="連接訂閱" name={['subscription_id']}>
						<Input />
					</Item>
				)}

				{!watchIsSubscription && (
					<div className="flex gap-x-4">
						<Item
							label="使用期限"
							name={['limit_type']}
							initialValue="unlimited"
						>
							<Select className="!w-40">
								<Select.Option value="unlimited">無期限</Select.Option>
								<Select.Option value="fixed">啟用後固定時間</Select.Option>
								<Select.Option value="assigned">指定到期日</Select.Option>
							</Select>
						</Item>
						<Item hidden name={['limit_value']} initialValue="" />
						<Item hidden name={['limit_unit']} initialValue="" />

						{'fixed' === watchLimitType && (
							<>
								<Item label="&nbsp;">
									<InputNumber
										className="w-full"
										min={1}
										max={100}
										defaultValue={1}
										onChange={(value) => {
											form.setFieldValue(['limit_value'], value)
										}}
									/>
								</Item>
								<Item label="&nbsp;">
									<Select
										className="!w-40"
										defaultValue="days"
										onChange={(value) => {
											form.setFieldValue(['limit_unit'], value)
										}}
									>
										<Select.Option value="days">天</Select.Option>
										<Select.Option value="months">月</Select.Option>
										<Select.Option value="years">年</Select.Option>
									</Select>
								</Item>
							</>
						)}
						{'assigned' === watchLimitType && (
							<Item label="&nbsp;">
								<DatePicker
									defaultValue={dayjs()}
									onChange={(value) => {
										form.setFieldValue(
											['limit_value'],
											value.format('YYYY-MM-DD'),
										)
										form.setFieldValue(['limit_unit'], '')
									}}
								/>
							</Item>
						)}
					</div>
				)}
			</Form>
		</Modal>
	)
}

export default index
