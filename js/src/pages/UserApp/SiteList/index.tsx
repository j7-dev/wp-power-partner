import { SiteListTable, DataType } from '@/components/SiteListTable'
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

  useEffect(() => {
    if (!result?.isFetching) {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    }
  }, [result?.isFetching])

  return <SiteListTable tableProps={tableProps} />
}

export default index
