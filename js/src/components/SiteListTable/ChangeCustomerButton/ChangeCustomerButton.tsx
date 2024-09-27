import React from 'react'
import { Tooltip } from 'antd'
import { UserSwitchOutlined } from '@ant-design/icons'

export const ChangeCustomerButton = ({
	onClick,
	containerRef,
}: {
	onClick: () => void
	containerRef: React.RefObject<HTMLDivElement>
}) => {
	return (
		<Tooltip
			placement="bottom"
			title="變更網站客戶"
			getPopupContainer={() => containerRef.current as HTMLElement}
		>
			<UserSwitchOutlined onClick={onClick} className="text-primary" />
		</Tooltip>
	)
}
