import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import { TSubscription } from '@/components/SubscriptionSelect/types'
import { AxiosResponse } from 'axios'
import { SelectProps, Tag } from 'antd'

type TSubscriptionSelectParams = {
  user_id: number | string
}

type TGetSubscriptionsResponse = AxiosResponse<TSubscription[]>

export const useSubscriptionSelect = ({
  user_id,
}: TSubscriptionSelectParams) => {
  const result = useQuery<TGetSubscriptionsResponse>({
    queryKey: ['get_subscriptions_by_user_id', user_id],
    queryFn: () =>
      axios.get(`/${kebab}/subscriptions`, {
        params: {
          user_id,
        },
      }),
    enabled: !!user_id,
  })

  const rawOptions = result?.data?.data || []

  const options: SelectProps['options'] = rawOptions.map((option) => ({
    value: option.id,
    label: (
      <div className="flex justify-between items-center">
        {`#${option?.id}  ${option?.post_title}`}
        <Tag color={getOrderStatusColor(option?.status)}>
          {getOrderStatusLabel(option?.status)}
        </Tag>
      </div>
    ),
  }))

  const selectProps: SelectProps = {
    className: 'w-full',
    options,
    loading: result.isFetching,
  }

  return {
    result,
    selectProps,
  }
}
