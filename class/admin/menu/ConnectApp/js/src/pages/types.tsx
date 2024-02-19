export type TAccountInfo = {
  email: string
  password: string
}

export type TIdentityData = {
  user_id: number
  power_money_amount: string
  email: string
} | null

export type TIdentity = {
  status: number
  message: string
  data: TIdentityData
}
