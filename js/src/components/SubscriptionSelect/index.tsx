import React, { FC } from 'react'
import { Form, Select, SelectProps, FormItemProps } from 'antd'

const { Item } = Form

export const SubscriptionSelect: FC<{
	containerRef?: React.RefObject<HTMLElement>
	formItemProps?: FormItemProps
	selectProps?: SelectProps
}> = ({ containerRef, formItemProps, selectProps }) => {
	return (
		<Item {...formItemProps}>
			<Select
				className="w-full"
				{...selectProps}
				getPopupContainer={() =>
					containerRef?.current || (document.body as HTMLElement)
				}
			/>
		</Item>
	)
}

export * from './useSubscriptionSelect'
