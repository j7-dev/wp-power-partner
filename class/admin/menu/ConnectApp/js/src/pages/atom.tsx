import { atom } from 'jotai'
import { TIdentity } from '@/pages/types'

export const identityAtom = atom<TIdentity>({
  status: 100,
  message: 'un-login',

  // TODO data: null,

  data: {
    user_id: 174,
    email: 'j7.dev.gg@gamil.com',
    power_money_amount: '29705.633',
  },
})

export const isSiderCollapsedAtom = atom(false)
