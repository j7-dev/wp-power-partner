import React from 'react'
import { Tooltip } from 'antd'
import { UserSwitchOutlined } from '@ant-design/icons'

export const ChangeCustomerButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Tooltip placement="bottom" title="變更網站客戶">
      <UserSwitchOutlined onClick={onClick} className="text-primary" />
    </Tooltip>
  )
}
