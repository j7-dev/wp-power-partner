import React from 'react'
import { EmailComponentProps } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { Form, Switch, Input } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'

const { Item } = Form

const EmailSwitch = ({ record, index }: EmailComponentProps) => {
	return (
		<>
			<Item
				name={['emails', index, 'enabled']}
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
				name={['emails', index, 'key']}
				initialValue={record?.key || ''}
				hidden
				shouldUpdate
			>
				<Input />
			</Item>
			<Item
				hidden
				name={['emails', index, 'body']}
				initialValue={record?.body || ''}
				shouldUpdate
			>
				<Input />
			</Item>
		</>
	)
}

export default EmailSwitch
