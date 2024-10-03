import React from 'react'
import { EmailComponentProps } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { Popconfirm, Form } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import { emailsAtom } from '@/pages/AdminApp/Dashboard/EmailSetting/atom'
import { useAtom } from 'jotai'

const DeleteButton = ({
	record,
	containerRef,
}: Pick<EmailComponentProps, 'record' | 'containerRef'>) => {
	const form = Form.useFormInstance()
	const [dataSource, setDataSource] = useAtom(emailsAtom)
	const handleDelete = () => {
		const newDataSource = dataSource.filter((item) => item.key !== record?.key)
		setDataSource(newDataSource)
		const formValues = form.getFieldsValue()
		form.setFieldsValue({
			...formValues,
			email: newDataSource,
		})
	}

	return (
		<Popconfirm
			title="你確認要刪除此 Email 嗎?"
			description="刪除後就無法復原"
			onConfirm={handleDelete}
			okText="確認"
			cancelText="取消"
			getPopupContainer={() => containerRef?.current || document.body}
		>
			<DeleteOutlined className="text-rose-500" />
		</Popconfirm>
	)
}

export default DeleteButton
