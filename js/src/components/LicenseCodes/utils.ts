import React from 'react'

export const getInfo = (selectedRowKeys:React.Key[]) => {
	const label = selectedRowKeys.length ? '修改' : '新增'
	const isEdit = !!selectedRowKeys.length
	const isCreate = !isEdit
	const isSingleEdit = selectedRowKeys.length === 1

	return {
		label,
		isEdit,
		isCreate,
		isSingleEdit
	}
}