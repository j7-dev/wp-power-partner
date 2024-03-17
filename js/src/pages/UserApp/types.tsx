export type TIdentityData = {
  partner_id: string
} | null

export type TIdentity = {
  status: number
  message: string
  data: TIdentityData
}
