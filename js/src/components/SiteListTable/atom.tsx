import { atom } from 'jotai'
import { DataTypeWithSubscriptionIds } from '@/components/SiteListTable/types'

export const chosenRecordAtom = atom<DataTypeWithSubscriptionIds | null>(null)
