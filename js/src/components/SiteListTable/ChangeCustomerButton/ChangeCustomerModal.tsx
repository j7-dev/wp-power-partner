import { useState, useEffect } from 'react'
import {
	Modal,
	ModalProps,
	Form,
	Alert,
	Select,
	FormInstance,
	Tag,
	Tooltip,
} from 'antd'
import { chosenRecordAtom } from '@/components/SiteListTable/atom'
import { useAtomValue } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab, siteUrl } from '@/utils'
import { AxiosResponse } from 'axios'
import { debounce } from 'lodash-es'
import { SubscriptionSelect, useSubscriptionSelect } from '@/components'

type TChangeCustomerParams = {
	modalProps: ModalProps
	form: FormInstance
}

type TCustomer = {
	id: string
	display_name: string
}

type TGetCustomersResponse = AxiosResponse<{
	status: number
	data: TCustomer[]
}>

export const ChangeCustomerModal = ({
	modalProps,
	form,
}: TChangeCustomerParams) => {
	const [search, setSearch] = useState<string>('')
	const chosenRecord = useAtomValue(chosenRecordAtom)
	const customerId = chosenRecord?.customer_id

	const { data, isPending } = useQuery<TGetCustomersResponse>({
		queryKey: ['get_customers_by_id', customerId],
		queryFn: () =>
			axios.get(`/${kebab}/customers-by-search`, {
				params: {
					id: customerId,
				},
			}),
		enabled: !!customerId,
	})

	const customers = data?.data?.data || []
	const customerName =
		customers.find((customer) => customer.id === customerId)?.display_name ||
		'未知客戶'

	// 下拉選單搜索

	const handleSearch = debounce((searchValue: string) => {
		setSearch(searchValue)
	}, 1500)

	const {
		data: dataSearched,
		isFetching: isLoadingSearched,
		isSuccess: isSuccessSearched,
	} = useQuery<TGetCustomersResponse>({
		queryKey: ['get_customers_by_search', search],
		queryFn: () =>
			axios.get(`/${kebab}/customers-by-search`, {
				params: {
					search,
				},
			}),
		enabled: search?.length > 1,
	})

	const searchedCustomers = dataSearched?.data?.data || []

	const getHelp = () => {
		if (isLoadingSearched) {
			return '搜尋中...'
		}
		if (isSuccessSearched && searchedCustomers?.length === 0) {
			return '找不到用戶，請換個關鍵字試試'
		}
		return '請輸入至少 2 個字元以搜尋客戶'
	}

	// 依照選擇的客戶不同，顯示不同的訂閱下拉選項

	const watchNewCustomerId = Form.useWatch(['new_customer_id'], form)
	const { selectProps, result: getSubscriptionResult } = useSubscriptionSelect({
		user_id: watchNewCustomerId,
	})
	const isEmptySubscriptions =
		getSubscriptionResult?.isSuccess &&
		getSubscriptionResult?.data?.data?.length === 0

	const subscriptions = getSubscriptionResult?.data?.data || []
	const isFetching = getSubscriptionResult?.isFetching

	// 依照選擇的訂閱不同，顯示不同的綁定 site_id

	const watchSubscriptionId = Form.useWatch(['subscription_id'], form)
	const selectedSubscription = subscriptions?.find(
		(subscription) => subscription.id === watchSubscriptionId,
	)
	const linkedSiteIds = selectedSubscription?.linked_site_ids || []

	const handleClose = (siteId: string) => {
		const linkedSiteIdsInForm: string[] | undefined = form.getFieldValue([
			'linked_site_ids',
		])
		form.setFieldsValue({
			linked_site_ids: linkedSiteIdsInForm?.filter(
				(id: string) => id !== siteId,
			),
		})
	}

	const watchLinkedSiteIds: string[] = Form.useWatch(['linked_site_ids'], form)

	// 改變訂閱時，將當前的 site_id 加入 linked_site_ids

	useEffect(() => {
		if (!chosenRecord) {
			return
		}
		const includeCurrentRecord = linkedSiteIds?.includes(
			chosenRecord?.ID?.toString(),
		)
		const linkedSiteIdsInForm = includeCurrentRecord
			? linkedSiteIds
			: [...linkedSiteIds, chosenRecord?.ID?.toString()]
		form.setFieldsValue({
			linked_site_ids: linkedSiteIdsInForm,
		})
	}, [watchSubscriptionId])

	// 清空 用戶時 清空 linked_site_ids 的值

	useEffect(() => {
		if (!watchNewCustomerId) {
			form.setFieldsValue({
				linked_site_ids: undefined,
			})
		}
	}, [watchNewCustomerId])

	const subscription_ids = chosenRecord?.subscription_ids || []
	const subscription_ids_node = subscription_ids.map((id) => (
		<a
			key={id}
			className="ml-2 inline"
			href={`${siteUrl}/wp-admin/post.php?post=${id}&action=edit`}
			target="_blank"
			rel="noreferrer"
		>{`#${id}`}</a>
	))

	return (
		<Modal {...modalProps}>
			<Form form={form} layout="vertical" className="mt-8">
				<Alert
					message="提醒："
					description="變更客戶後，此網站將不再顯示在舊用戶前台的站台列表裡面"
					type="info"
					showIcon
				/>
				<div className="mb-6 mt-8">
					<p className="text-[0.875rem] mt-0 mb-2">當前客戶</p>
					<p className="m-0 rounded-md bg-gray-100 border-solid border-[1px] border-gray-300 py-1 px-3">
						{isPending ? (
							<div className="animate-pulse bg-slate-400 h-4 w-20 rounded" />
						) : (
							`${customerName} - #${customerId}`
						)}
					</p>
				</div>
				<Form.Item
					label="新客戶"
					name={['new_customer_id']}
					rules={[
						{ required: true, message: '請輸入至少 2 個字元以搜尋客戶' },
					]}
					help={getHelp()}
				>
					<Select
						showSearch
						allowClear
						loading={isLoadingSearched}
						placeholder="請輸入至少 2 個字元以搜尋客戶"
						defaultActiveFirstOption={false}
						suffixIcon={null}
						filterOption={false}
						onSearch={handleSearch}
						notFoundContent={null}
						options={(searchedCustomers || [])?.map((c) => ({
							value: c.id,
							label: `${c.display_name} - #${c.id}`,
						}))}
					/>
				</Form.Item>
				<SubscriptionSelect
					formItemProps={{
						name: ['subscription_id'],
						label: (
							<span className="inline">
								{`將此網站 #${chosenRecord?.ID} 綁定到新客戶的訂閱上`}
								<br />
								目前綁定的訂閱為
								{subscription_ids_node}
							</span>
						),
					}}
					selectProps={{
						...selectProps,
						disabled: !watchNewCustomerId || isEmptySubscriptions || isFetching,
						placeholder: isEmptySubscriptions
							? '此用戶沒有任何訂閱紀錄'
							: '請選擇要綁定的訂閱',
					}}
				/>

				<Form.Item name={['linked_site_ids']} hidden>
					<Select mode="multiple" />
				</Form.Item>
			</Form>
			{selectedSubscription && (
				<>
					<p>確認變更後，綁定在此訂閱上的 site ids 如下: </p>
					{watchLinkedSiteIds?.map((linkedSiteId) => {
						const isCurrentRecord =
							chosenRecord?.ID?.toString() === linkedSiteId
						return (
							<Tooltip
								key={linkedSiteId}
								title={isCurrentRecord ? '本次新增' : ''}
							>
								<Tag
									closable={!isCurrentRecord}
									onClose={(e) => {
										e.preventDefault()

										handleClose(linkedSiteId)
									}}
									className={isCurrentRecord ? 'border-dashed' : ''}
								>
									#{linkedSiteId}
								</Tag>
							</Tooltip>
						)
					})}
				</>
			)}
		</Modal>
	)
}
