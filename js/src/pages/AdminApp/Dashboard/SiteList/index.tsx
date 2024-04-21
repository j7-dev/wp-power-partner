import { SiteListTable, DataType } from '@/components/SiteListTable'
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
    },
    queryOptions: {
      enabled: !!user_id,
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

  return <SiteListTable tableProps={tableProps} isAdmin />
}

export default index
