import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab } from '@/utils'
import { TGetAppsResponse } from '@/components/SiteListTable/types'

export const useApps = ({ app_ids }: { app_ids: string[] }) => {
  const result = useQuery<TGetAppsResponse>({
    queryKey: ['get_partner_apps', app_ids.join(', ')],
    queryFn: () =>
      axios.get(`/${kebab}/apps`, {
        params: {
          app_ids,
        },
      }),
    enabled: !!app_ids?.length,
  })

  return result
}
