import {
  SiteListTable,
  useCustomers,
  useTable,
} from '@/components/SiteListTable'
import { identityAtom, globalLoadingAtom } from '@/pages/UserApp/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { currentUserId } from '@/utils'

const index = () => {
  const identity = useAtomValue(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)

  const partner_id = identity.data?.partner_id || ''

  const { tableProps } = useTable({
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
    if (!tableProps?.loading) {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    }
  }, [tableProps?.loading])

  return (
    <SiteListTable tableProps={tableProps} customerResult={customerResult} />
  )
}

export default index
