import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { cloudAxios } from '@/api'

type TProduct = {
	slug: string
	label: string
	rate: number
}

export const useProducts = () => {
	const result = useQuery({
		queryKey: ['license-codes/products'],
		queryFn: () => cloudAxios.get('/license-codes/products'),
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
	})
	const products: TProduct[] = result.data?.data || []
	const productOptions = products.map(({ slug, label }) => ({
		label: label,
		value: slug,
	}))

	return productOptions
}
