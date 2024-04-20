import React, { useEffect } from 'react'
import { EmailComponentProps } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { Select, Form, InputNumber, Space } from 'antd'
import { REDUX } from '@/pages/AdminApp/Dashboard/EmailSetting/utils'

const { Item } = Form

const actionNameOptions = [
  { label: '開站後發信', value: 'site_sync' },
  {
    label: '客戶續訂失敗後發信',
    value: 'subscription_failed',
  },
  {
    label: '客戶續訂成功後發信',
    value: 'subscription_success',
  },
]

const operatorOptions = [
  { label: '天後發出', value: 'after' },

  // { label: '天前發出', value: 'before' },
]

const SendingCondition = ({ record, index }: EmailComponentProps) => {
  const form = Form.useFormInstance()
  const actionNameName = [index, REDUX.ACTION_NAME_FIELD_NAME]
  const daysName = [index, REDUX.DAYS_FIELD_NAME]
  const operatorName = [index, REDUX.OPERATOR_FIELD_NAME]

  const watchActionName = Form.useWatch(actionNameName, form)

  useEffect(() => {
    if ('site_sync' === watchActionName) {
      form.setFieldValue(daysName, 0)
      form.setFieldValue(operatorName, 'after')
    }
  }, [watchActionName])

  return (
    <div className="flex">
      <Space.Compact block>
        <Item
          name={actionNameName}
          initialValue={record?.action_name || actionNameOptions?.[0]?.value}
          className="mb-0"
          shouldUpdate
        >
          <Select className="w-[200px]" options={actionNameOptions} />
        </Item>
        <Item
          name={daysName}
          initialValue={record?.days || 0}
          className="mb-0"
          shouldUpdate
        >
          <InputNumber
            className="w-16"
            min={0}
            disabled={'site_sync' === watchActionName}
          />
        </Item>
        <Item
          name={operatorName}
          initialValue={record?.operator || operatorOptions?.[0]?.value}
          className="mb-0"
          shouldUpdate
        >
          <Select
            className="w-32 pointer-events-none"
            options={operatorOptions}
          />
        </Item>
      </Space.Compact>
    </div>
  )
}

export default SendingCondition
