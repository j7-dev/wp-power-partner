export type DataType = {
  key: string
  enabled: boolean
  subject: string
  body: string
  action_name: string
  days: number
  operator: 'after' | 'before'
}

export type EmailComponentProps = {
  record: DataType
  index: number
}
