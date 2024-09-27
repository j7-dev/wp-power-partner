import { FC, useRef } from 'react'
import { BooleanIndicator } from '@/components'
import { DataType } from '@/components/SiteListTable/types'
import { Typography } from 'antd'

const { Text } = Typography

export const SystemInfo: FC<{ record: DataType }> = ({ record }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const wpcd_app_disk_space_quota =
		record?.wpcd_app_disk_space_quota &&
		Number(record?.wpcd_app_disk_space_quota) !== 0
			? `${(
					Number(record?.wpcd_app_disk_space_quota) / 1000
				).toLocaleString()} GB`
			: 'N/A'
	return (
		<div
			className="grid grid-cols-[6rem_3rem_6rem_3rem] gap-1 text-xs"
			ref={containerRef}
		>
			<span className="bg-gray-200 px-2">WordPress</span>
			<span className="place-self-end">{record?.wpapp_current_version}</span>
			<span className="bg-gray-200 px-2">php</span>
			<span className="place-self-end">{record?.wpapp_php_version}</span>
			<span className="bg-gray-200 px-2">WP_DEBUG</span>
			<div className="place-self-end">
				<BooleanIndicator
					enabled={record?.wpapp_wp_debug === '1'}
					containerRef={containerRef}
				/>
			</div>
			<span className="bg-gray-200 px-2">ssl</span>
			<div className="place-self-end">
				<BooleanIndicator
					enabled={record?.wpapp_ssl_status === 'on'}
					containerRef={containerRef}
				/>
			</div>
			<span className="bg-gray-200 px-2">http2</span>
			<div className="place-self-end">
				<BooleanIndicator
					enabled={record?.wpapp_ssl_http2_status === 'on'}
					containerRef={containerRef}
				/>
			</div>
			<span className="bg-gray-200 px-2">redis</span>
			<div className="place-self-end">
				<BooleanIndicator
					enabled={record?.wpapp_redis_status === 'on'}
					containerRef={containerRef}
				/>
			</div>
			<span className="bg-gray-200 px-2">硬碟空間限制</span>
			<span className="col-span-3 place-self-end">
				{wpcd_app_disk_space_quota}
			</span>
			<span className="bg-gray-200 px-2">IPv4</span>
			<span className="col-span-3 place-self-end">
				<Text className="text-xs" copyable>
					{record?.ipv4}
				</Text>
			</span>
		</div>
	)
}
