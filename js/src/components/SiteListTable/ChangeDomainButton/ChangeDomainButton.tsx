import React from 'react'
import { Tooltip } from 'antd'
import { EditOutlined } from '@ant-design/icons'

export const ChangeDomainButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <Tooltip placement="bottom" title="變更域名 ( domain name )">
      <EditOutlined onClick={onClick} className="text-primary" />
    </Tooltip>
  )
}
