import React from 'react'
import { DataType } from './types'
import { DateTime } from 'antd-toolkit'

const LIMIT_UNIT_MAP = {
	days: '天',
	months: '月',
	years: '年',
}

const ExpireDate = ({ record }: { record: DataType }) => {
	const { limit_type, limit_value, limit_unit, post_status, expire_date } =
		record

	if (limit_type === 'fixed' && post_status !== 'activated') {
		return `啟用後 ${limit_value} ${LIMIT_UNIT_MAP?.[limit_unit] || ''}`
	}

	return expire_date ? <DateTime date={expire_date * 1000} /> : '無期限'
}

export default ExpireDate
