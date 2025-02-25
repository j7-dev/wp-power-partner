import React from 'react'
import { DataType } from './types'
import { Tooltip } from 'antd'
import { TSubscriptionsNextPayment } from './hooks/useSubscriptionsNextPayment'
import dayjs from 'dayjs'
import { InfoCircleOutlined } from '@ant-design/icons'

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
				<>
					<Tooltip
						title="已關閉自動續約"
						getPopupContainer={() => containerRef?.current as HTMLElement}
					>
						<InfoCircleOutlined className="mr-2" />
					</Tooltip>
					跟隨訂閱狀態
				</>
			)
		}

		return (
			<>
				<Tooltip
					title={`於 ${dayjs(nextPayment.time * 1000).format('YYYY-MM-DD HH:mm:ss')} 自動續約`}
					getPopupContainer={() => containerRef?.current as HTMLElement}
				>
					<InfoCircleOutlined className="mr-2" />
				</Tooltip>
				跟隨訂閱狀態
			</>
		)
	}

	if (limit_type === 'fixed' && post_status !== 'activated') {
		return (
			<>
				<Tooltip
					title="啟用後，才會計算到期日"
					getPopupContainer={() => containerRef?.current as HTMLElement}
				>
					<InfoCircleOutlined className="mr-2" />
				</Tooltip>
				啟用後 {limit_value} {LIMIT_UNIT_MAP?.[limit_unit] || ''}
			</>
		)
	}

	if (expire_date) {
		const diff = dayjs(expire_date * 1000).diff(dayjs(), 'day')
		return (
			<>
				<Tooltip
					title={`可以使用至 ${dayjs(expire_date * 1000).format('YYYY-MM-DD HH:mm:ss')}`}
					getPopupContainer={() => containerRef?.current as HTMLElement}
				>
					<InfoCircleOutlined className="mr-2" />
				</Tooltip>
				剩餘 {diff > 0 ? diff : 0} 天
			</>
		)
	}

	return (
		<>
			<Tooltip
				title="此授權碼無期限，可以一直使用"
				getPopupContainer={() => containerRef?.current as HTMLElement}
			>
				<InfoCircleOutlined className="mr-2" />
			</Tooltip>
			無期限
		</>
	)
}

export default ExpireDate
