import { identityAtom, globalLoadingAtom } from '@/pages/UserApp/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { currentUserId } from '@/utils'
import { DataType, TParams } from '@/components/LicenseCodes/types'
import { LicenseCodes } from '@/components'
import { useTable } from '@/hooks'

const index = () => {
	const identity = useAtomValue(identityAtom)
	const partner_id = identity.data?.partner_id || ''

	const setGlobalLoading = useSetAtom(globalLoadingAtom)
	const [search, setSearch] = useState('')

	const { tableProps } = useTable<TParams, DataType>({
		resource: 'license-codes',
		defaultParams: {
			author: partner_id,
			customer_id: currentUserId,
			search,
		},
		queryOptions: {
			enabled: !!partner_id && !!currentUserId,
			staleTime: 1000 * 60 * 60 * 24,
			gcTime: 1000 * 60 * 60 * 24,
		},
	})

	useEffect(() => {
		if (!tableProps?.loading) {
			setGlobalLoading({
				isLoading: false,
				label: '',
			})
		}
	}, [tableProps?.loading])

	return <LicenseCodes tableProps={tableProps} setSearch={setSearch} />
}

export default index
