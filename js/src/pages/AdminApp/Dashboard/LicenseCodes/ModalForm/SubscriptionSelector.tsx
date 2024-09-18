import React, { useState, useEffect } from 'react'
import { Form, Select } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab } from '@/utils'
import { AxiosResponse } from 'axios'
import { debounce } from 'lodash-es'
import { SubscriptionSelect, useSubscriptionSelect } from '@/components'

type TCustomer = {
	id: string
	display_name: string
}

type TGetCustomersResponse = AxiosResponse<{
	status: number
	data: TCustomer[]
}>

const SubscriptionSelector = () => {
	const form = Form.useFormInstance()
	const [search, setSearch] = useState<string>('')

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

	const watchCustomerId = Form.useWatch(['customer_id'], form)
	const { selectProps, result: getSubscriptionResult } = useSubscriptionSelect({
		user_id: watchCustomerId,
	})
	const isEmptySubscriptions =
		getSubscriptionResult?.isSuccess &&
		getSubscriptionResult?.data?.data?.length === 0

	const isFetching = getSubscriptionResult?.isFetching

	useEffect(() => {
		form.setFieldValue(['subscription_id'], undefined)
	}, [watchCustomerId])

	return (
		<>
			<Form.Item
				label="新客戶"
				name={['customer_id']}
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
					label: <span className="inline">將此授權碼綁定到新客戶的訂閱上</span>,
				}}
				selectProps={{
					...selectProps,
					disabled: !watchCustomerId || isEmptySubscriptions || isFetching,
					placeholder: isEmptySubscriptions
						? '此用戶沒有任何訂閱紀錄'
						: '請選擇要綁定的訂閱',
				}}
			/>
		</>
	)
}

export default React.memo(SubscriptionSelector)
