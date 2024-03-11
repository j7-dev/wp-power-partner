import { atom } from 'jotai'
import { TIdentity } from '@/pages/AdminApp/types'

export const defaultIdentity: TIdentity = {
  status: 100,
  message: 'un-login',
  data: null,

  // FOR TEST
  // data: {
  //   user_id: '174',
  //   email: 'j7.dev.gg@gamil.com',
  //   power_money_amount: '29,705.633',
  //   partner_lv: {
  //     key: '1',
  //     title: '低階經銷商',
  //     discount: '0.70',
  //   },
  // },
}

export const identityAtom = atom<TIdentity>(defaultIdentity)

export const globalLoadingAtom = atom({
  isLoading: false,
  label: '',
})
