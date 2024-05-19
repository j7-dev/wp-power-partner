import {
  SiteListTable,
  DataType,
  useCustomers,
} from '@/components/SiteListTable'
import { TSiteExtraParams } from './types'
import { identityAtom, globalLoadingAtom } from '@/pages/UserApp/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { useTable } from '@/hooks'
import { useEffect } from 'react'
import { currentUserId } from '@/utils'

const index = () => {
  const identity = useAtomValue(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)

  const partner_id = identity.data?.partner_id || ''

  const { tableProps, result } = useTable<TSiteExtraParams, DataType>({
    resource: 'apps',
    defaultParams: {
      user_id: partner_id,
      customer_id: currentUserId.toString(),
    },
    queryOptions: {
      enabled: !!partner_id && !!currentUserId,
    },
  })

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
    <SiteListTable tableProps={tableProps} customerResult={customerResult} />
  )
}

export default index
