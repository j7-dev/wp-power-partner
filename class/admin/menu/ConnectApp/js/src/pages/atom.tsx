import { atom } from 'jotai'
import { TIdentity } from '@/pages/types'

export const identityAtom = atom<TIdentity>({
  status: 100,
  message: 'un-login',

  // TODO data: null,

  data: {
    user_id: 174,
    email: 'j7.dev.gg@gamil.com',
    power_money_amount: '29,705.633',
    partner_lv: {
      key: '1',
      title: '低階經銷商',
      discount: '0.70',
    },
  },
})
