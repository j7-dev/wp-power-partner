import { cloudAxios } from '@/api'
import { useQuery } from '@tanstack/react-query'
import { Table, TableProps, Tag, Typography } from 'antd'
import { DataType } from './types'
import { TPagination } from '@/types'
import { identityAtom } from '@/pages/atom'
import { useAtomValue } from 'jotai'

type TData = {
  data: {
    data: {
      list: DataType[]
      pagination: TPagination
    }
  }
}

const { Paragraph } = Typography

const LogTypeTag: React.FC<{ record: DataType }> = ({ record }) => {
  const type = record?.type || ''
  switch (type) {
    case 'cron':
      return <Tag color="purple">每日扣點</Tag>
    case 'modify':
      return <Tag color="magenta">管理員直接修改</Tag>
    case 'purchase':
      return <Tag color="cyan">儲值</Tag>
    default:
      return <></>
  }
}

const index = () => {
  const identity = useAtomValue(identityAtom)
  const user_id = identity.data?.user_id || ''
  const params = {
    user_id: user_id.toString(),
  }
  const { data, isLoading } = useQuery<TData>(['logs'], () =>
    cloudAxios.get('/logs', { params }),
  )
  const dataSource = data?.data?.data?.list || []
  const pagination = data?.data?.data?.pagination
    ? {
        ...data?.data?.data?.pagination,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 筆`,
      }
    : false

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 160,
    },
    {
      title: '分類',
      dataIndex: 'type',
      width: 144,
      render: (_, record) => <LogTypeTag record={record} />,
    },
    {
      title: 'Power Money 變化',
      dataIndex: 'point_changed',
      width: 144,
      align: 'right',
    },
    {
      title: '餘額',
      dataIndex: 'new_balance',
      width: 208,
      align: 'right',
    },
    {
      title: '說明',
      dataIndex: 'title',
      render: (value: string) => (
        <Paragraph
          copyable
          ellipsis={{
            rows: 2,
            expandable: true,
            symbol: '更多',
          }}
          className="whitespace-break-spaces m-0"
        >
          {value}
        </Paragraph>
      ),
    },
  ]
  return (
    <Table
      rowKey="id"
      loading={isLoading}
      size="small"
      dataSource={dataSource}
      columns={columns}
      pagination={pagination}
      scroll={{ x: 860 }}
    />
  )
}

export default index
