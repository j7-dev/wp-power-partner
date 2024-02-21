import { useEffect } from 'react'
import { cloudAxios } from '@/api'
import { identityAtom, globalLoadingAtom } from '@/pages/atom'
import { useSetAtom } from 'jotai'
import { notification } from 'antd'
import { renderHTML, LOCALSTORAGE_ACCOUNT_KEY, decrypt } from '@/utils'
import { TAccountInfo, TIdentity } from '@/pages/types'
import { useMutation } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'

export const useGetUserIdentity = () => {
  const setIdentity = useSetAtom(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)
  const accountInLocalStorage = localStorage.getItem(LOCALSTORAGE_ACCOUNT_KEY)

  const mutation = useMutation({
    mutationKey: ['identity'],
    mutationFn: (values: TAccountInfo) => {
      setGlobalLoading({
        isLoading: true,
        label: '正在獲取用戶資料...',
      })

      return cloudAxios.post('/identity', values)
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
    onSettled: () => {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    },
    staleTime: 1000 * 60 * 60 * 24,
    cacheTime: 1000 * 60 * 60 * 24,
  } as any)

  useEffect(() => {
    if (accountInLocalStorage) {
      const theAccountInfo = decrypt(accountInLocalStorage, true)
      mutation.mutate(theAccountInfo)
    }
  }, [accountInLocalStorage])

  return mutation
}
