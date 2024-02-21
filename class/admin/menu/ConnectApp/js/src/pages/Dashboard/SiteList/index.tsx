import { Table, TableProps, Tag } from 'antd'
import { CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { SystemInfo } from '@/components'
import { DataType, TSiteExtraParams } from './types'
import { identityAtom, globalLoadingAtom } from '@/pages/atom'
import { useAtomValue, useSetAtom } from 'jotai'
import { useTable } from '@/pages/hooks/useTable'
import { useEffect } from 'react'

const index = () => {
  const identity = useAtomValue(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)

  const user_id = identity.data?.user_id || ''

  const { tableProps, result } = useTable<TSiteExtraParams, DataType>({
    resource: 'apps',
    defaultParams: {
      user_id,
    },
    queryOptions: {
      enabled: !!user_id,
    },
  })

  useEffect(() => {
    if (!result?.isFetching) {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    }
  }, [result?.isFetching])

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '網站名稱',
      dataIndex: 'post_title',
      render: (value: string, record) => (
        <>
          <p className="mb-1">
            <a target="_blank" href={record?.wpapp_domain} rel="noreferrer">
              {value}
            </a>
          </p>
          {record?.wpapp_site_status === 'off' ? (
            <Tag
              icon={<CloseCircleOutlined />}
              color="#f50"
              className="text-xs"
            >
              網站已停用
            </Tag>
          ) : (
            <Tag
              icon={<SyncOutlined spin />}
              color="#2db7f5"
              className="text-xs"
            >
              網站運作中
            </Tag>
          )}
        </>
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
  ]
  return <Table rowKey="ID" columns={columns} {...tableProps} />
}

export default index
