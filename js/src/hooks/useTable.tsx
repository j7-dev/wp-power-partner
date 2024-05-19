import { useState, useLayoutEffect } from 'react'
import { TParamsBase, TPagination } from '@/types'
import {
  UseQueryOptions,
  useQuery,
  UndefinedInitialDataOptions,
} from '@tanstack/react-query'
import { cloudAxios } from '@/api'
import { TableProps } from 'antd'

/*
 * T - params 的篩選屬性型別
 * K - table record 的資料型別
 */

export const useTable = <T, K>({
  resource,
  defaultParams,
  queryOptions,
}: {
  resource: string
  defaultParams: T
  queryOptions?: Omit<UseQueryOptions, 'queryKey'>
}) => {
  type TData = {
    data: {
      data: {
        list: K[]
        pagination: TPagination
      }
    }
  }

  const [params, setParams] = useState<T & TParamsBase>({
    ...defaultParams,
  } as T & TParamsBase)

  useLayoutEffect(() => {
    setParams({ ...defaultParams } as T & TParamsBase)
  }, [JSON.stringify(defaultParams)])

  const result = useQuery<T & TParamsBase, any, TData, any>({
    queryKey: [`${resource}`, JSON.stringify(params)] as any,
    queryFn: () => cloudAxios.get(`/${resource}`, { params }),
    ...queryOptions,
  } as any)

  const handlePaginationChange = (page: number, pageSize: number) => {
    const offset = (page - 1) * (pageSize || 10)
    setParams({
      ...params,
      offset,
      numberposts: pageSize,
    })
  }

  const pagination = result?.data?.data?.data?.pagination
    ? {
        ...result?.data?.data?.data?.pagination,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 筆`,
        onChange: handlePaginationChange,
        pageSizeOptions: [
          '10',
          '20',
          '50',
          '100',
        ],
      }
    : false

  const dataSource = result?.data?.data?.data?.list || []

  const tableProps: TableProps<K> = {
    loading: result?.isFetching,
    size: 'small',
    dataSource,
    pagination,
    scroll: { x: 860 },
  }

  return {
    tableProps,
    params,
    setParams,
    result,
  }
}
