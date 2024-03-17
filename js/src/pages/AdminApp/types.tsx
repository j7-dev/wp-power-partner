export type TAccountInfo = {
  email: string
  password: string
}

export type TIdentityData = {
  user_id: string
  power_money_amount: string
  email: string
  partner_lv?: {
    key: string
    title: string
    discount: string
  }
} | null

export type TIdentity = {
  status: number
  message: string
  data: TIdentityData
}
