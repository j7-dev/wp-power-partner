import React from 'react'
import { DataType } from './types'
import { DateTime } from 'antd-toolkit'
import { Tooltip } from 'antd'
import { TSubscriptionsNextPayment } from './hooks/useSubscriptionsNextPayment'
import dayjs from 'dayjs'

const LIMIT_UNIT_MAP = {
	days: '天',
	months: '月',
	years: '年',
}

const ExpireDate = ({
	record,
	nextPayments,
	containerRef,
}: {
	record: DataType
	nextPayments: TSubscriptionsNextPayment[]
	containerRef: React.RefObject<HTMLDivElement>
}) => {
	const {
		limit_type,
		limit_value,
		limit_unit,
		post_status,
		expire_date,
		subscription_id,
	} = record
	if (!!subscription_id) {
		const nextPayment = nextPayments.find(
			(payment) => payment.id === subscription_id,
		)

		if (!nextPayment || !nextPayment?.time) {
			return (
				<Tooltip
					title="當訂閱不是啟用狀態時，授權碼就會過期"
					getPopupContainer={() => containerRef?.current as HTMLElement}
				>
					跟隨訂閱狀態
				</Tooltip>
			)
		}

		return (
			<Tooltip
				title={`當訂閱不是啟用狀態時，授權碼就會過期，於 ${dayjs(nextPayment.time * 1000).format('YYYY-MM-DD HH:mm:ss')} 自動續約`}
				getPopupContainer={() => containerRef?.current as HTMLElement}
			>
				跟隨訂閱狀態
				<DateTime date={nextPayment.time * 1000} />
			</Tooltip>
		)
	}

	if (limit_type === 'fixed' && post_status !== 'activated') {
		return `啟用後 ${limit_value} ${LIMIT_UNIT_MAP?.[limit_unit] || ''}`
	}

	return expire_date ? <DateTime date={expire_date * 1000} /> : '無期限'
}

export default ExpireDate
