/* eslint-disable @typescript-eslint/no-empty-function */

import { Tooltip, Popconfirm } from 'antd'
import {
  CloseCircleOutlined,
  LoadingOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import { DataTypeWithSubscriptionIds as DataType } from '@/components/SiteListTable/types'
import { cloudAxios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationInstance } from 'antd/es/notification/interface'
import { partner_id, currentUserId } from '@/utils'

type TToggleSiteParams = {
  site_id: string
  partner_id: string
  reason?: string
}

type TToggleSslButtonProps = {
  record: DataType
  notificationApi: NotificationInstance
}

const getSiteActionText = (isEnabled: boolean) => (isEnabled ? '啟用' : '禁用')

const index = ({
  record: rowRecord,
  notificationApi: api,
}: TToggleSslButtonProps) => {
  const isEnabled = rowRecord?.wpapp_site_status !== 'off'
  const queryClient = useQueryClient()

  const { mutate: toggleSite } = useMutation({
    mutationFn: (values: TToggleSiteParams) => {
      return cloudAxios.post('/v2/toggle-site', values)
    },
    onMutate: (values: TToggleSiteParams) => {
      const site_id = values?.site_id
      const text = getSiteActionText(!isEnabled)
      api.open({
        key: `loading-toggle-site-${site_id}`,
        message: `網站 ${text} 中...`,
        description: `${text} ${rowRecord?.wpapp_domain} 網站 有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。`,
        duration: 0,
        icon: <LoadingOutlined className="text-primary" />,
      })
    },
    onSuccess: (data, values) => {
      const status = data?.data?.status
      const site_id = values?.site_id
      const text = getSiteActionText(!isEnabled)
      if (200 === status) {
        api.success({
          key: `loading-toggle-site-${site_id}`,
          message: `網站 已${text}`,
          description: `${text} ${rowRecord?.wpapp_domain} 網站 成功`,
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      } else {
        api.error({
          key: `loading-toggle-site-${site_id}`,
          message: `網站 ${text} 失敗`,
          description: `${text} ${rowRecord?.wpapp_domain} 網站 失敗，${data?.data?.message}`,
        })
      }
    },
    onError: (err, values) => {
      const site_id = values?.site_id
      const text = getSiteActionText(!isEnabled)
      api.error({
        key: `loading-toggle-site-${site_id}`,
        message: `網站 ${text} 失敗`,
        description: `${text} ${rowRecord?.wpapp_domain} 網站 失敗`,
      })
    },
  })

  const handleToggleSite = (record: DataType) => () => {
    toggleSite({
      site_id: record?.ID?.toString(),
      partner_id,
      reason: `用戶ID: #${currentUserId} ，手動開關站台，原本為 ${getSiteActionText(isEnabled)} 狀態，執行後為 ${getSiteActionText(!isEnabled)} 狀態`,
    })
  }

  return (
    <Popconfirm
      title={`目前網站狀態為已${getSiteActionText(
        isEnabled,
      )}，點擊後將${getSiteActionText(!isEnabled)} 網站`}
      description="你確認要執行這個操作嗎?"
      onConfirm={handleToggleSite(rowRecord)}
      okText="確認"
      cancelText="取消"
    >
      <Tooltip
        placement="bottom"
        title={`目前網站狀態為${getSiteActionText(
          isEnabled,
        )}，點擊後將${getSiteActionText(!isEnabled)} 網站`}
      >
        {isEnabled ? (
          <SyncOutlined spin className="text-primary" />
        ) : (
          <CloseCircleOutlined className="text-gray-400" />
        )}
      </Tooltip>
    </Popconfirm>
  )
}

export default index
