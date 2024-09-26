import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab } from '@/utils'

export type TSubscriptionsNextPayment = {
	id: number
	time: number
}

type TUseSubscriptionsNextPaymentParams = {
	subscription_ids: number[]
}

export const useSubscriptionsNextPayment = ({
	subscription_ids,
}: TUseSubscriptionsNextPaymentParams) => {
	const result = useQuery({
		queryKey: ['subscriptions/next-payment'],
		queryFn: () =>
			axios.get(
				`${kebab}/subscriptions/next-payment?${subscription_ids.map((id) => `ids[]=${id}`).join('&')}`,
			),
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		enabled: !!subscription_ids.length,
	})
	const nextPayments: TSubscriptionsNextPayment[] = result.data?.data || []

	return nextPayments
}
