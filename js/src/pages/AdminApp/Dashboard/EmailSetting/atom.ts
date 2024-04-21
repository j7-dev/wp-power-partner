import { atom } from 'jotai'
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'

export const emailsAtom = atom<DataType[]>([])
export const focusEmailIndexAtom = atom<{
  index: number
  actionName: string
} | null>(null)
