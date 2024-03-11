import { FC, useState, useEffect } from 'react'
import {
  Table,
  TableProps,
  Tag,
  Button,
  Tooltip,
  Modal,
  Form,
  Input,
  Typography,
  notification,
  Alert,
  Popconfirm,
  Spin,
} from 'antd'
import {
  CloseCircleOutlined,
  SyncOutlined,
  EditOutlined,
  UnlockOutlined,
  LockOutlined,
} from '@ant-design/icons'
import { SystemInfo } from '@/components'
import { DataType } from './types'
import { cloudAxios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const { Paragraph } = Typography

type TChangeDomainParams = {
  id: string
  new_domain: string
}

type TFormValues = {
  new_domain: string
}

export * from './types'

export const SiteListTable: FC<{ tableProps: TableProps<DataType> }> = ({
  tableProps,
}) => {
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [chosenRecord, setChosenRecord] = useState<DataType | null>(null)
  const [chosenSSLRecord, setChosenSSLRecord] = useState<DataType | null>(null)

  const queryClient = useQueryClient()
  const { mutate: changeDomain, isLoading } = useMutation({
    mutationFn: (values: TChangeDomainParams) =>
      cloudAxios.post('/change-domain', values),
    onSettled: () => {
      setIsModalOpen(false)
    },
    onSuccess: (data) => {
      const status = data?.data?.status

      if (200 === status) {
        notification.success({
          message: '域名變更成功',
          description: `域名已成功變更為 ${form.getFieldValue('new_domain')}`,
        })
        queryClient.invalidateQueries(['apps'])
      } else {
        notification.error({
          message: 'OOPS! 域名變更時發生問題',
          description: data?.data?.message,
        })
      }
    },
  })

  const { mutate: toggleSSL, isLoading: toggleSSLIsLoading } = useMutation({
    mutationFn: (values: { id: string }) =>
      cloudAxios.post('/toggle-ssl', values),
  })

  const showModal = (record: DataType) => () => {
    setIsModalOpen(true)
    setChosenRecord(record)
  }

  const handleOk = () => {
    form.validateFields().then((values: TFormValues) => {
      changeDomain(
        {
          id: chosenRecord?.ID.toString() || '',
          new_domain: values?.new_domain,
        },
        {
          onError: (err) => {
            console.log('err', err)
            notification.error({
              message: `OOPS! 變更 ${chosenRecord?.wpapp_domain} 網域時 時發生問題`,
            })
          },
        },
      )
    })
  }

  const handleCancel = () => {
    if (!isLoading) {
      setIsModalOpen(false)
    }
  }

  const isChosenRecordSslOn = chosenSSLRecord?.wpapp_ssl_status === 'on'

  const handleToggleSSL = (record: DataType) => () => {
    const isSslOn = record?.wpapp_ssl_status === 'on'
    setChosenSSLRecord(record)
    toggleSSL(
      {
        id: record?.ID.toString() || '',
      },
      {
        onSuccess: (data) => {
          const status = data?.data?.status
          if (200 === status) {
            notification.success({
              message: isSslOn
                ? `${record?.wpapp_domain} SSL 已關閉`
                : `${record?.wpapp_domain} SSL 已啟用`,
            })
            queryClient.invalidateQueries(['apps'])
          } else {
            notification.error({
              message: isSslOn
                ? `OOPS! 關閉 ${record?.wpapp_domain} SSL 時發生問題`
                : `OOPS! 啟用 ${record?.wpapp_domain} SSL 時發生問題`,
              description: data?.data?.message,
            })
          }
        },
        onError: (err) => {
          console.log('err', err)
          notification.error({
            message: isSslOn
              ? `OOPS! 關閉 ${record?.wpapp_domain} SSL 時發生問題`
              : `OOPS! 啟用 ${record?.wpapp_domain} SSL 時發生問題`,
          })
        },
      },
    )
  }

  useEffect(() => {
    form.setFieldsValue({
      current_domain: chosenRecord?.wpapp_domain,
    })
  }, [chosenRecord?.wpapp_domain])

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '網站名稱',
      dataIndex: 'post_title',
      render: (value: string, record) => (
        <>
          <p className="mb-1 mt-0">
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
        const isRecordSslOn = record?.wpapp_ssl_status === 'on'

        return (
          <div className="flex">
            <Tooltip
              placement="bottom"
              title="變更域名 ( domain name )"
              className="mr-2"
            >
              <Button
                type="primary"
                size="small"
                shape="circle"
                icon={<EditOutlined />}
                onClick={showModal(record)}
              />
            </Tooltip>
            <Popconfirm
              title={
                isRecordSslOn
                  ? '目前 SSL 狀態為啟用，點擊後將關閉 SSL'
                  : '目前 SSL 狀態為關閉，點擊後將啟用 SSL'
              }
              description="你確認要執行這個操作嗎?"
              onConfirm={handleToggleSSL(record)}
              okText="確認"
              cancelText="取消"
            >
              <Tooltip
                placement="bottom"
                title={
                  isRecordSslOn
                    ? '目前 SSL 狀態為啟用，點擊關閉 SSL'
                    : '目前 SSL 狀態為關閉，點擊啟用 SSL'
                }
              >
                <Button
                  disabled={toggleSSLIsLoading}
                  type="primary"
                  className={isRecordSslOn ? 'bg-lime-500' : 'bg-rose-500'}
                  size="small"
                  shape="circle"
                  icon={isRecordSslOn ? <LockOutlined /> : <UnlockOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </div>
        )
      },
    },
  ]
  return (
    <>
      <Spin
        spinning={toggleSSLIsLoading}
        tip={
          isChosenRecordSslOn
            ? `關閉 ${chosenSSLRecord?.wpapp_domain} SSL 中...`
            : `啟用 ${chosenSSLRecord?.wpapp_domain} SSL 中...`
        }
      >
        <Table
          rowKey="ID"
          tableLayout="auto"
          columns={columns}
          {...tableProps}
        />
      </Spin>
      <Modal
        centered
        title="變更域名 ( domain name )"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          <Button
            type="primary"
            danger
            onClick={handleOk}
            loading={isLoading}
            className="mr-0"
          >
            確認變更域名 ( domain name )
          </Button>
        }
      >
        <Form form={form} layout="vertical" className="mt-8">
          {isLoading ? (
            <Alert
              message="請耐心等待"
              description="網域變更有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。"
              type="warning"
              showIcon
            />
          ) : (
            <Alert
              message="提醒："
              description="請先將網域DNS設定中的A紀錄(A Record) 指向 [ip]，再變更網域"
              type="info"
              showIcon
            />
          )}

          <div className="mb-6 mt-8">
            <p className="text-[0.875rem] mt-0 mb-2">當前域名</p>
            <Paragraph
              className="m-0 rounded-md bg-gray-100 border-solid border-[1px] border-gray-300 py-1 px-3"
              copyable
            >
              {chosenRecord?.wpapp_domain}
            </Paragraph>
          </div>
          <Form.Item
            label="新域名"
            name={['new_domain']}
            rules={[
              { required: true, message: '請輸入新的 domain name' },
              {
                // 匹配 1~4個 . 且不含http(s)://的網址

                pattern:
                  /^(?!http(s)?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/g,
                message: (
                  <>
                    請輸入不含 <Tag>http(s)://</Tag> 的合格的網址
                  </>
                ),
              },
            ]}
          >
            <Input disabled={isLoading} placeholder="請輸入新的 domain name" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
