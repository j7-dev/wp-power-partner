import { atom } from 'jotai'
import { DataType } from '@/components/SiteListTable/types'

export const chosenRecordAtom = atom<DataType | null>(null)
