import React from 'react'
import { DataType } from './types'
import { DateTime } from 'antd-toolkit'
import { Tooltip } from 'antd'

const LIMIT_UNIT_MAP = {
	days: '天',
	months: '月',
	years: '年',
}

const ExpireDate = ({ record }: { record: DataType }) => {
	const {
		limit_type,
		limit_value,
		limit_unit,
		post_status,
		expire_date,
		is_subscription,
	} = record
	if (is_subscription) {
		return (
			<Tooltip title="當訂閱不是啟用狀態時，授權碼就會過期">
				跟隨訂閱狀態
			</Tooltip>
		)
	}

	if (limit_type === 'fixed' && post_status !== 'activated') {
		return `啟用後 ${limit_value} ${LIMIT_UNIT_MAP?.[limit_unit] || ''}`
	}

	return expire_date ? <DateTime date={expire_date * 1000} /> : '無期限'
}

export default ExpireDate
