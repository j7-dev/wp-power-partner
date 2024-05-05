import { FC } from 'react'
import { Table, TableProps, Tooltip, notification } from 'antd'
import { UserSwitchOutlined } from '@ant-design/icons'
import { SystemInfo } from '@/components'
import { DataType } from '@/components/SiteListTable/types'
import ToggleSslButton from '@/components/SiteListTable/ToggleSslButton'
import ToggleSiteButton from '@/components/SiteListTable/ToggleSiteButton'
import { BreathLight } from 'antd-toolkit'
import {
  ChangeDomainModal,
  ChangeDomainButton,
  useChangeDomain,
} from '@/components/SiteListTable/ChangeDomainButton'

import {
  ChangeCustomerModal,
  ChangeCustomerButton,
  useChangeCustomer,
} from '@/components/SiteListTable/ChangeCustomerButton'

export * from './types'

export const SiteListTable: FC<{
  tableProps: TableProps<DataType>
  isAdmin?: boolean
}> = ({ tableProps, isAdmin = false }) => {
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
    stack: { threshold: 1 },
    duration: 10,
  })
  const {
    modalProps: modalPropsCD,
    show: showCD,
    form: formCD,
  } = useChangeDomain({
    api,
  })

  const {
    modalProps: modalPropsCC,
    show: showCC,
    form: formCC,
  } = useChangeCustomer({
    api,
  })
  const columns: TableProps<DataType>['columns'] = [
    {
      title: '網站名稱',
      dataIndex: 'post_title',
      render: (value: string, record) => (
        <>
          <p className="mb-1 mt-0 flex items-center gap-x-2">
            <BreathLight
              color={
                record?.wpapp_site_status !== 'off' ? '#84cc16' : '#f43f5e'
              }
            />

            <a
              target="_blank"
              href={`${
                record?.wpapp_ssl_status === 'on' ? 'https' : 'http'
              }://${record?.wpapp_domain}`}
              rel="noreferrer"
            >
              {value}
            </a>
          </p>
          {/* {record?.wpapp_site_status === 'off' ? (
            <Tag
              icon={<CloseCircleOutlined />}
              color="#f50"
              className="text-xs"
            >
              服務已停用
            </Tag>
          ) : (
            <Tag
              icon={<SyncOutlined spin />}
              color="#2db7f5"
              className="text-xs"
            >
              服務已啟用
            </Tag>
          )} */}
        </>
      ),
    },
    {
      title: '使用者',
      dataIndex: 'wpapp_user',
      render: (_: string, record) => (
        <div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
          <span className="bg-gray-200 px-2">使用者</span>
          <span className="place-self-end">{record?.wpapp_user}</span>
          <span className="bg-gray-200 px-2">Email</span>
          <span className="place-self-end">{record?.wpapp_email}</span>
        </div>
      ),
    },
    {
      title: '創建日期',
      dataIndex: 'post_date',
      render: (_: string, record) => (
        <div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
          <span className="bg-gray-200 px-2">創建</span>
          <span className="place-self-end">{record?.post_date}</span>
          <span className="bg-gray-200 px-2">上次變更</span>
          <span className="place-self-end">{record?.post_modified}</span>
          <span className="bg-gray-200 px-2">網站 id</span>
          <span className="place-self-end">#{record?.ID}</span>
          <span className="bg-gray-200 px-2">訂單編號</span>
          <span className="place-self-end">
            {record?.wpapp_wc_order_id ? `#${record?.wpapp_wc_order_id}` : '-'}
          </span>
        </div>
      ),
    },
    {
      title: '系統資訊',
      dataIndex: 'wpapp_php_version',
      render: (_: string, record) => <SystemInfo record={record} />,
    },
    {
      title: '操作',
      dataIndex: 'actions',
      render: (_: string, record) => {
        return (
          <div className="flex gap-3">
            <ChangeDomainButton onClick={showCD(record)} />
            <ChangeCustomerButton onClick={showCC(record)} />
            <ToggleSslButton record={record} notificationApi={api} />
            {isAdmin && (
              <ToggleSiteButton record={record} notificationApi={api} />
            )}
          </div>
        )
      },
    },
  ]
  return (
    <>
      {contextHolder}
      <Table rowKey="ID" tableLayout="auto" columns={columns} {...tableProps} />
      <ChangeDomainModal modalProps={modalPropsCD} form={formCD} />
      <ChangeCustomerModal modalProps={modalPropsCC} form={formCC} />
    </>
  )
}
