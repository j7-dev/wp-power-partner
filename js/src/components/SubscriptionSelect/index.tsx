import React, { FC } from 'react'
import { Form, Select, SelectProps, FormItemProps } from 'antd'

const { Item } = Form

export const SubscriptionSelect: FC<{
  formItemProps?: FormItemProps
  selectProps?: SelectProps
}> = ({ formItemProps, selectProps }) => {
  return (
    <Item {...formItemProps}>
      <Select className="w-full" {...selectProps} />
    </Item>
  )
}

export * from './useSubscriptionSelect'
