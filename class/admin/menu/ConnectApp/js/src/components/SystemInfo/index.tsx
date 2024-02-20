import { FC } from 'react'
import { BooleanIndicator } from '@/components'
import { DataType } from '@/pages/Dashboard/SiteList/types'

export const SystemInfo: FC<{ record: DataType }> = ({ record }) => {
  return (
    <div className="grid grid-cols-[6rem_3rem_6rem_3rem] gap-1 text-xs">
      <span className="bg-gray-200 px-2">WordPress</span>
      <span className="place-self-end">{record?.wpapp_current_version}</span>
      <span className="bg-gray-200 px-2">php</span>
      <span className="place-self-end">{record?.wpapp_php_version}</span>
      <span className="bg-gray-200 px-2">wp_debug</span>
      <div className="place-self-end">
        <BooleanIndicator enabled={record?.wpapp_wp_debug === '1'} />
      </div>
      <span className="bg-gray-200 px-2">ssl</span>
      <div className="place-self-end">
        <BooleanIndicator enabled={record?.wpapp_ssl_status === 'on'} />
      </div>
      <span className="bg-gray-200 px-2">http2</span>
      <div className="place-self-end">
        <BooleanIndicator enabled={record?.wpapp_ssl_http2_status === 'on'} />
      </div>
      <span className="bg-gray-200 px-2">redis</span>
      <div className="place-self-end">
        <BooleanIndicator enabled={record?.wpapp_redis_status === 'on'} />
      </div>
      <span className="bg-gray-200 px-2">硬碟空間限制</span>
      <span className="col-span-3 place-self-end">
        {record?.wpcd_app_disk_space_quota}
      </span>
    </div>
  )
}
