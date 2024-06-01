import React from 'react'
import { InputNumber } from 'antd'
import { disable_site_after_n_days } from '@/utils'

const NAME = 'power_plugins_settings[power_partner_disable_site_after_n_days]'
const DEFAULT = disable_site_after_n_days

const index = () => {
  return (
    <>
      <p>
        當訂閱轉為<span className="bg-gray-200 px-1 mx-1">非啟用</span>
        狀態後，幾天後會<span className="bg-gray-200 px-1 mx-1">禁用</span>
        關聯的網站
      </p>
      <InputNumber
        addonAfter="天"
        name={NAME}
        defaultValue={DEFAULT}
        min={0}
        max={100}
      />
    </>
  )
}

export default index
