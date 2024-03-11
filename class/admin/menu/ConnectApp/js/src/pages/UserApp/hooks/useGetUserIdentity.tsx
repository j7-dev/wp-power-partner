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

  const result = useQuery({
    queryKey: ['identity'],
    queryFn: () => {
      setGlobalLoading({
        isLoading: true,
        label: '正在獲取用戶資料...',
      })

      return axios.get('/power-partner/partner-id')
    },
    onError: (err: any) => {
      console.log('err', err)
    },
    onSuccess: (res: AxiosResponse<TIdentity>) => {
      const theIdentity = res?.data as TIdentity
      setIdentity(theIdentity)
      if (theIdentity?.status !== 200) {
        notification.error({
          message: theIdentity?.message,
          description: renderHTML(JSON.stringify(theIdentity?.data || '')),
        })
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    cacheTime: 1000 * 60 * 60 * 24,
  })

  return result
}
