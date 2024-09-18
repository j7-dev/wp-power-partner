import React, { useState } from 'react'
import { ModalProps } from 'antd'

export const useModal = (modalProps?: ModalProps) => {
	const [open, setOpen] = useState(false)

	const show = () => {
		setOpen(true)
	}

	const close = () => {
		setOpen(false)
	}

	const mergedModalProps: ModalProps = {
		open,
		onCancel: close,
		cancelText: '取消',
		okText: '確認',
		centered: true,
		width: 800,
		...modalProps,
	}

	return {
		open,
		setOpen,
		show,
		close,
		modalProps: mergedModalProps,
	}
}
