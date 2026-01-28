import { atom } from 'jotai'
import { TIdentity } from '@/pages/AdminApp/types'

export const defaultIdentity: TIdentity = {
  status: 100,
  message: 'un-login',
  data: null,
}

export const identityAtom = atom<TIdentity>(defaultIdentity)

export const globalLoadingAtom = atom({
  isLoading: false,
  label: '',
})
