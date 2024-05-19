import {
  SiteListTable,
  DataType,
  useCustomers,
} from '@/components/SiteListTable'
import { TSiteExtraParams } from './types'
import { identityAtom, globalLoadingAtom } from '@/pages/AdminApp/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { useTable } from '@/hooks'
import { useEffect } from 'react'

const index = () => {
  const identity = useAtomValue(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)

  const user_id = identity.data?.user_id || ''

  const { tableProps, result } = useTable<TSiteExtraParams, DataType>({
    resource: 'apps',
    defaultParams: {
      user_id,
      offset: 0,
      numberposts: 10,
    },
    queryOptions: {
      enabled: !!user_id,
      staleTime: 1000 * 60 * 60 * 24,
      gcTime: 1000 * 60 * 60 * 24,
    },
  })

  // 取得所有網站的 customer 資料

  const all_customer_ids =
    tableProps?.dataSource
      ?.map((site) => site.customer_id)
      .filter((value, i, self) => self.indexOf(value) === i) || [] // remove duplicates

  const customerResult = useCustomers({ user_ids: all_customer_ids })

  useEffect(() => {
    if (!result?.isFetching) {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    }
  }, [result?.isFetching])

  return (
    <SiteListTable
      tableProps={tableProps}
      customerResult={customerResult}
      isAdmin
    />
  )
}

export default index
