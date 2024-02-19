import { atom } from 'jotai'
import { TIdentity } from '@/pages/types'

export const identityAtom = atom<TIdentity>({
  status: 100,
  message: 'un-login',
  data: null,
})
