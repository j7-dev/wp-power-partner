import { useQuery } from '@tanstack/react-query'
import { cloudAxios } from '@/api'
import { useAtomValue } from 'jotai'
import { identityAtom } from '@/pages/AdminApp/atom'

type TProduct = {
	slug: string
	label: string
	rate: number
}

export const useProducts = () => {
	const identity = useAtomValue(identityAtom)
	const user_id = identity?.data?.user_id || '0'

	const result = useQuery({
		queryKey: ['license-codes/products'],
		queryFn: () => cloudAxios.get(`/license-codes/products?user_id=${user_id}`),
		staleTime: 1000 * 60 * 60 * 24,
		gcTime: 1000 * 60 * 60 * 24,
		enabled: !!user_id,
	})
	const products: TProduct[] = result.data?.data || []
	const productOptions = products.map(({ slug, label }) => ({
		label: label,
		value: slug,
	}))

	return productOptions
}
