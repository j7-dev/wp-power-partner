import { FC } from 'react'
import { Tooltip } from 'antd'

export const BooleanIndicator: FC<{ enabled: boolean }> = ({ enabled }) => {
  return (
    <Tooltip className="inline-block" title={enabled ? '啟用中' : '已停止'}>
      <div
        className={`h-3 w-3 rounded-full ${
          enabled ? 'bg-lime-500' : 'bg-rose-500'
        }`}
      ></div>
    </Tooltip>
  )
}
