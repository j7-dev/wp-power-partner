import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab } from '@/utils'
import { TGetCustomersResponse } from '@/components/SiteListTable/types'

export const useCustomers = ({ user_ids }: { user_ids: string[] }) => {
  const result = useQuery<TGetCustomersResponse>({
    queryKey: ['get_customers', user_ids.join(', ')],
    queryFn: () =>
      axios.get(`/${kebab}/customers`, {
        params: {
          user_ids,
        },
      }),
    enabled: !!user_ids?.length,
  })

  return result
}
