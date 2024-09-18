import { useTable as useGeneralTable } from '@/hooks'
import {
	DataType,
	TSiteExtraParams,
	DataTypeWithSubscriptionIds,
} from '@/components/SiteListTable/types'
import { useApps } from './useApps'
import { UseQueryOptions } from '@tanstack/react-query'
import { TableProps } from 'antd'

export const useTable = (params: {
	resource: string
	defaultParams: TSiteExtraParams
	queryOptions?: Omit<UseQueryOptions, 'queryKey'>
}) => {
	const { tableProps } = useGeneralTable<TSiteExtraParams, DataType>(params)

	const dataSource = tableProps?.dataSource || []

	const app_ids = dataSource.map((site) => site.ID.toString())

	const { data: dataApps, isFetching: isFetchingApps } = useApps({ app_ids })
	const localApps = dataApps?.data || []

	const formattedDataSource: DataTypeWithSubscriptionIds[] = dataSource.map(
		(site) => {
			const subscription_ids =
				localApps.find((app) => app.app_id === site.ID.toString())
					?.subscription_ids || []

			return {
				...site,
				subscription_ids,
			}
		},
	)

	return {
		tableProps: {
			...tableProps,
			dataSource: formattedDataSource,
			loading: tableProps?.loading || isFetchingApps,
		} as TableProps<DataTypeWithSubscriptionIds>,
	}
}
