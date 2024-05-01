/* eslint-disable @typescript-eslint/no-empty-function */

import { Tooltip, Popconfirm } from 'antd'
import {
  LockOutlined,
  LoadingOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import { DataType } from '@/components/SiteListTable/types'
import { cloudAxios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationInstance } from 'antd/es/notification/interface'
import { currentUserId } from '@/utils'

type TToggleSSLParams = {
  id: string
  record: DataType | null
  reason?: string
}

type TToggleSslButtonProps = {
  record: DataType
  notificationApi: NotificationInstance
}

const getSSLActionText = (isRecordSslOn: boolean) =>
  isRecordSslOn ? '啟用' : '關閉'

const index = ({
  record: rolRecord,
  notificationApi: api,
}: TToggleSslButtonProps) => {
  const isRecordSslOn = rolRecord?.wpapp_ssl_status === 'on'
  const queryClient = useQueryClient()

  const { mutate: toggleSSL } = useMutation({
    mutationFn: (values: TToggleSSLParams) => {
      const { record: _, ...rest } = values
      return cloudAxios.post('/toggle-ssl', rest)
    },
    onMutate: (values: TToggleSSLParams) => {
      const { record, id } = values
      const text = getSSLActionText(!isRecordSslOn)
      api.open({
        key: `loading-toggle-SSL-${id}`,
        message: `SSL ${text} 中...`,
        description: `${text} ${record?.wpapp_domain} SSL 有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。`,
        duration: 0,
        icon: <LoadingOutlined className="text-primary" />,
      })

      return record
    },
    onSuccess: (data, values) => {
      const status = data?.data?.status
      const { record, id } = values
      const text = getSSLActionText(!isRecordSslOn)

      if (200 === status) {
        api.success({
          key: `loading-toggle-SSL-${id}`,
          message: `SSL 已${text}`,
          description: `${text} ${record?.wpapp_domain} SSL 成功`,
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      } else {
        api.error({
          key: `loading-toggle-SSL-${id}`,
          message: `SSL ${text} 失敗`,
          description: `${text} ${record?.wpapp_domain} SSL 失敗，${data?.data?.message}`,
        })
      }
    },
    onError: (err, values) => {
      const { record, id } = values
      const text = getSSLActionText(!isRecordSslOn)
      console.log('err', err)
      api.error({
        key: `loading-toggle-SSL-${id}`,
        message: `SSL ${text} 失敗`,
        description: `${text} ${record?.wpapp_domain} SSL 失敗`,
      })
    },
  })

  const handleToggleSSL = (record: DataType) => () => {
    toggleSSL({
      id: record?.ID.toString() || '',
      record,
      reason: `用戶ID: #${currentUserId} ，手動開關SSL，原本為 ${getSSLActionText(isRecordSslOn)} 狀態，執行後為 ${getSSLActionText(!isRecordSslOn)} 狀態`,
    })
  }

  return (
    <Popconfirm
      title={`目前 SSL 狀態為${getSSLActionText(
        isRecordSslOn,
      )}，點擊後將${getSSLActionText(!isRecordSslOn)} SSL`}
      description="你確認要執行這個操作嗎?"
      onConfirm={handleToggleSSL(rolRecord)}
      okText="確認"
      cancelText="取消"
    >
      <Tooltip
        placement="bottom"
        title={`目前 SSL 狀態為${getSSLActionText(
          isRecordSslOn,
        )}，點擊後將${getSSLActionText(!isRecordSslOn)} SSL`}
      >
        {isRecordSslOn ? (
          <LockOutlined className="text-primary" />
        ) : (
          <UnlockOutlined className="text-gray-400" />
        )}
      </Tooltip>
    </Popconfirm>
  )
}

export default index
