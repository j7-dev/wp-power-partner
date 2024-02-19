import { axios, cloudAxios } from '@/api'
import { identityAtom } from '@/pages/atom'
import { useAtom } from 'jotai'
import { notification } from 'antd'
import { renderHTML } from '@/utils'
import { TAccountInfo } from '@/pages/types'
import { useQuery } from '@tanstack/react-query'
import { AxiosResponse } from 'axios'

export const useGetUsermetaIdentity = () => {
  const [identity, setIdentity] = useAtom(identityAtom)
  const result = useQuery<
    unknown,
    unknown,
    AxiosResponse<{
      data: TAccountInfo | undefined
    }>
  >(
    ['get-user-identity'],
    () => axios.get('/power-partner/get-usermeta-identity'),
    {
      onSuccess: (res) => {
        const theAccountInfo = res?.data?.data
        if (theAccountInfo) {
          cloudAxios
            .post('/identity', {
              email: theAccountInfo?.email,
              password: theAccountInfo?.password,
            })
            .then((cloudRes) => {
              const theIdentity = cloudRes?.data
              setIdentity(theIdentity)
              if (theIdentity?.status !== 200) {
                notification.error({
                  message: theIdentity?.message,
                  description: renderHTML(theIdentity?.data || ''),
                })
              }
            })
        }
      },
      onError: (error) => {
        console.log('err', error)
      },
    },
  )

  return result
}
