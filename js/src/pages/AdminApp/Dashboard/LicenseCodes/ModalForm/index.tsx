import React, { FC, useEffect } from 'react'
import { Modal, Form, InputNumber, Select, DatePicker, Switch, Tag } from 'antd'
import { TUseModal } from '@/hooks'
import { getInfo } from '../utils'
import {
	useProducts,
	useCreate,
	TCreateParams,
	useUpdate,
	TUpdateParams,
} from '../hooks'
import { DataType } from '../types'
import dayjs from 'dayjs'
import { NotificationInstance } from 'antd/es/notification/interface'
import SubscriptionSelector from './SubscriptionSelector'
import { identityAtom } from '@/pages/AdminApp/atom'
import { useAtomValue } from 'jotai'

const { Item } = Form

const index: FC<{
	containerRef: React.RefObject<HTMLDivElement>
	selectedRowKeys: React.Key[]
	useModalResult: TUseModal
	theSingleRecord: DataType | undefined
	notificationInstance: NotificationInstance
}> = ({
	containerRef,
	selectedRowKeys,
	useModalResult,
	theSingleRecord,
	notificationInstance: api,
}) => {
	const identity = useAtomValue(identityAtom)
	const user_id = identity.data?.user_id || ''
	const { open, close, modalProps } = useModalResult
	const { label, isEdit, isSingleEdit } = getInfo(selectedRowKeys)

	const { mutate: create, isPending: isCreating } = useCreate({ api, close })
	const { mutate: update, isPending: isUpdating } = useUpdate({ api, close })

	const handleOk = () => {
		form.validateFields().then((values) => {
			if (isEdit) {
				const formattedValues: TUpdateParams = {
					...values,
					post_author: user_id,
					is_subscription: undefined,
					ids: selectedRowKeys,
				}

				update(formattedValues)
			} else {
				const formattedValues: TCreateParams = {
					...values,
					post_author: user_id,
					is_subscription: undefined,
					post_status: undefined,
				}

				create(formattedValues)
			}
		})
	}
	const [form] = Form.useForm()

	const productOptions = useProducts()
	const watchIsSubscription = Form.useWatch(['is_subscription'], form)
	const watchLimitType = Form.useWatch(['limit_type'], form)

	useEffect(() => {
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
	}, [watchLimitType])

	useEffect(() => {
		if (!theSingleRecord) {
			return
		}
		form.setFieldsValue({
			...theSingleRecord,
			post_status: 'available',
			customer_id: undefined,
			subscription_id: undefined,
		})
	}, [theSingleRecord])

	useEffect(() => {
		if (open && !isSingleEdit) {
			form.resetFields()
		}
	}, [open, isSingleEdit])

	return (
		<Modal
			forceRender
			getContainer={containerRef?.current as HTMLElement}
			title={`批量${label}授權碼 ${isEdit ? `(${selectedRowKeys.length}) 筆` : ''}`}
			{...modalProps}
			onOk={handleOk}
			confirmLoading={isCreating || isUpdating}
		>
			{!!isEdit && (
				<div>
					{selectedRowKeys.map((key) => (
						<Tag color="blue" bordered={false} key={key}>
							#{key as string}
						</Tag>
					))}
				</div>
			)}
			<Form form={form} layout="vertical" className="mt-8">
				<div className="flex gap-x-4">
					<Item
						label="修改狀態"
						name={['post_status']}
						initialValue="available"
						rules={[
							{
								required: true,
								message: '請選擇狀態',
							},
						]}
					>
						<Select
							className="!w-40"
							disabled={!isEdit}
							getPopupContainer={() => containerRef?.current as HTMLElement}
						>
							<Select.Option value="available">可用</Select.Option>
							{/* <Select.Option value="activated">已啟用</Select.Option> */}
							<Select.Option value="deactivated">已停用</Select.Option>
							{/* <Select.Option value="expired">已過期</Select.Option> */}
						</Select>
					</Item>

					<Item
						label="連接商品"
						name={['product_slug']}
						initialValue={productOptions?.[0]?.value}
						rules={[
							{
								required: true,
								message: '請選擇商品',
							},
						]}
					>
						<Select
							className="!w-40"
							options={productOptions}
							getPopupContainer={() => containerRef?.current as HTMLElement}
						/>
					</Item>
					{!isEdit && (
						<Item
							label="數量"
							name={['quantity']}
							initialValue={1}
							rules={[
								{
									required: true,
									message: '請輸入數量',
								},
							]}
						>
							<InputNumber className="w-full" min={1} max={30} />
						</Item>
					)}
				</div>

				{!!isEdit && (
					<Item
						label="綁訂訂閱"
						name={['is_subscription']}
						initialValue={false}
						valuePropName="checked"
						tooltip="綁訂訂閱後，授權碼狀態將跟自動隨訂閱狀態調整"
					>
						<Switch />
					</Item>
				)}

				{!!watchIsSubscription && !!isEdit && (
					<SubscriptionSelector containerRef={containerRef} />
				)}

				{!watchIsSubscription && (
					<div className="flex gap-x-4">
						<Item
							label="使用期限"
							name={['limit_type']}
							initialValue="unlimited"
						>
							<Select
								className="!w-40"
								getPopupContainer={() => containerRef?.current as HTMLElement}
							>
								<Select.Option value="unlimited">無期限</Select.Option>
								<Select.Option value="fixed">啟用後固定時間</Select.Option>
								<Select.Option value="assigned">指定到期日</Select.Option>
							</Select>
						</Item>
						{/* <Item hidden name={['limit_value']} initialValue="" />
						<Item hidden name={['limit_unit']} initialValue="" /> */}

						{'fixed' === watchLimitType && (
							<>
								<Item label="&nbsp;" name={['limit_value']} initialValue={1}>
									<InputNumber className="w-full" min={1} max={100} />
								</Item>
								<Item label="&nbsp;" name={['limit_unit']} initialValue="days">
									<Select
										className="!w-40"
										getPopupContainer={() =>
											containerRef?.current as HTMLElement
										}
									>
										<Select.Option value="days">天</Select.Option>
										<Select.Option value="months">月</Select.Option>
										<Select.Option value="years">年</Select.Option>
									</Select>
								</Item>
							</>
						)}
						{'assigned' === watchLimitType && (
							<Item
								label="&nbsp;"
								name={['limit_value']}
								initialValue={dayjs()}
								getValueProps={(value) => {
									const regex = /^\d{4}-\d{2}-\d{2}$/
									if (regex.test(value)) {
										return {
											value: dayjs(value),
										}
									}
									return {
										value: dayjs(),
									}
								}}
								normalize={(value) => {
									if (value) {
										return dayjs(value).format('YYYY-MM-DD')
									}
									return value
								}}
							>
								<DatePicker />
							</Item>
						)}
					</div>
				)}
			</Form>
		</Modal>
	)
}

export default React.memo(index)
