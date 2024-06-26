import React, { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { emailsAtom } from '@/pages/AdminApp/Dashboard/EmailSetting/atom'
import { useSetAtom } from 'jotai'
import { AxiosError, AxiosResponse } from 'axios'
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'

const useGetEmails = () => {
  const setDataSource = useSetAtom(emailsAtom)
  const result = useQuery<
    AxiosResponse<DataType[]>,
    AxiosError,
    AxiosResponse<DataType[]>,
    string[]
  >({
    queryKey: ['emails'],
    queryFn: () => axios.get('/power-partner/emails'),
    staleTime: 1000 * 60 * 60 * 24,
  })

  const { isPending, data: rawDataSource } = result

  useEffect(() => {
    if (!isPending) {
      if (Array.isArray(rawDataSource?.data)) {
        setDataSource(rawDataSource?.data || [])
      } else {
        setDataSource([])
      }
    }
  }, [isPending])

  return result
}

export default useGetEmails
