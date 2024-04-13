import React from 'react'
import { EmailComponentProps } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { Form, Switch, Input } from 'antd'
import { REDUX } from '@/pages/AdminApp/Dashboard/EmailSetting/utils'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

const { Item } = Form

const DeleteButton = ({ record, index }: EmailComponentProps) => {
  return (
    <>
      <Item
        name={[index, REDUX.ENABLED_FIELD_NAME]}
        initialValue={record?.enabled || false}
        className="mb-0"
        valuePropName="checked"
        shouldUpdate
      >
        <Switch
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
        />
      </Item>
      <Item
        name={[index, REDUX.KEY_FIELD_NAME]}
        initialValue={record?.key || ''}
        hidden
        shouldUpdate
      >
        <Input />
      </Item>
      <Item
        hidden
        name={[index, REDUX.BODY_FIELD_NAME]}
        initialValue={record?.body || ''}
        shouldUpdate
      >
        <Input />
      </Item>
    </>
  )
}

export default DeleteButton
