import { atom } from 'jotai'
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'

export const emailsAtom = atom<DataType[]>([])
