import React from 'react'
import { Tooltip } from 'antd'
import { EditOutlined } from '@ant-design/icons'

export const ChangeDomainButton = ({
	onClick,
	containerRef,
}: {
	onClick: () => void
	containerRef: React.RefObject<HTMLDivElement>
}) => {
	return (
		<Tooltip
			placement="bottom"
			title="變更域名 ( domain name )"
			getPopupContainer={() => containerRef.current as HTMLElement}
		>
			<EditOutlined onClick={onClick} className="text-primary" />
		</Tooltip>
	)
}
