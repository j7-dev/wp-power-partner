export type DataType = {
  id: string
  title: string
  type: 'cron' | 'modify' | 'purchase'
  user_id: string
  modified_by: string
  date: string
  point_slug: 'power_money'
  point_changed: string
  new_balance: string
}
