import { axios } from '@/api'
import { identityAtom, globalLoadingAtom } from '@/pages/UserApp/atom'
import { useSetAtom } from 'jotai'
import { notification } from 'antd'
import { renderHTML } from '@/utils'
import { TIdentity } from '@/pages/UserApp/types'
import { useQuery } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'

export const useGetUserIdentity = () => {
  const setIdentity = useSetAtom(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)

  const result = useQuery<AxiosResponse<TIdentity>>({
    queryKey: ['identity'],
    queryFn: () => {
      setGlobalLoading({
        isLoading: true,
        label: '正在獲取用戶資料...',
      })

      return axios.get('/power-partner/partner-id')
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24,
  })

  const { error, data } = result

  if (error) {
    console.log('error ', error)
  }

  if (data) {
    const theIdentity = data?.data as TIdentity
    setIdentity(theIdentity)
    if (theIdentity?.status !== 200) {
      notification.error({
        message: theIdentity?.message,
        description: renderHTML(JSON.stringify(theIdentity?.data || '')),
      })
    }
  }

  return result
}
