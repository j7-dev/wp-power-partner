import { useState } from 'react'
import { TParamsBase, TPagination } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { cloudAxios } from '@/api'
import { TableProps } from 'antd'

/*
 * T - params 的篩選屬性型別
 * K - table record 的資料型別
 */

export const useTable = <T, K>(endpoint: string, defaultParams: T) => {
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

  const result = useQuery<TData>([`${endpoint}`, JSON.stringify(params)], () =>
    cloudAxios.get(`/${endpoint}`, { params }),
  )

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
          '2',
          '10',
          '20',
          '50',
          '100',
        ],
      }
    : false

  const dataSource = result?.data?.data?.data?.list || []

  const tableProps: TableProps<K> = {
    loading: result?.isLoading,
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
