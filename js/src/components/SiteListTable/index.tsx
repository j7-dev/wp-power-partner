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
} from 'antd'
import { EditOutlined, LoadingOutlined } from '@ant-design/icons'
import { SystemInfo } from '@/components'
import { DataType } from '@/components/SiteListTable/types'
import { cloudAxios } from '@/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ToggleSslButton from '@/components/SiteListTable/ToggleSslButton'
import ToggleSiteButton from '@/components/SiteListTable/ToggleSiteButton'
import { BreathLight } from 'antd-toolkit'

const { Paragraph } = Typography

type TChangeDomainParams = {
  id: string
  new_domain: string
  record: DataType | null
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
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
    stack: { threshold: 1 },
    duration: 10,
  })

  const queryClient = useQueryClient()
  const { mutate: changeDomain } = useMutation({
    mutationFn: (values: TChangeDomainParams) => {
      const { record: _, ...rest } = values
      return cloudAxios.post('/change-domain', rest)
    },
    onMutate: (values) => {
      const { record, id, new_domain } = values
      setIsModalOpen(false)
      api.open({
        key: `loading-change-domain-${id}`,
        message: '域名變更中...',
        description: `正在將 ${record?.wpapp_domain} 變更為 ${new_domain} ...網域變更有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。`,
        duration: 0,
        icon: <LoadingOutlined className="text-primary" />,
      })

      return record
    },
    onSuccess: (data, values) => {
      const { record, id, new_domain } = values
      const status = data?.data?.status

      if (200 === status) {
        api.success({
          key: `loading-change-domain-${id}`,
          message: '域名變更成功',
          description: `${record?.wpapp_domain} 已成功變更為 ${new_domain}`,
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      } else {
        api.error({
          key: `loading-change-domain-${id}`,
          message: 'OOPS! 域名變更時發生問題',
          description: `${record?.wpapp_domain} 已變更為 ${new_domain} 失敗， ${data?.data?.message}`,
        })
      }
    },
    onError: (err, values) => {
      const { record, id, new_domain } = values
      console.log('err', err)
      api.error({
        key: `loading-change-domain-${id}`,
        message: 'OOPS! 域名變更時發生問題',
        description: `${record?.wpapp_domain} 已變更為 ${new_domain} 失敗`,
      })
    },
  })

  const showModal = (record: DataType) => () => {
    setIsModalOpen(true)
    setChosenRecord(record)
  }

  const handleChangeDomain = () => {
    form.validateFields().then((formValues: TFormValues) => {
      changeDomain({
        id: chosenRecord?.ID.toString() || '',
        new_domain: formValues?.new_domain,
        record: chosenRecord,
      })
    })
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  useEffect(() => {
    form.setFieldsValue({
      current_domain: chosenRecord?.wpapp_domain,
    })
  }, [chosenRecord?.wpapp_domain])

  // 重開 Modal 時清空 input

  useEffect(() => {
    if (isModalOpen) {
      form.setFieldsValue({
        new_domain: '',
      })
    }
  }, [isModalOpen])

  const columns: TableProps<DataType>['columns'] = [
    {
      title: '網站名稱',
      dataIndex: 'post_title',
      render: (value: string, record) => (
        <>
          <p className="mb-1 mt-0 flex items-center gap-x-2">
            <div className="relative top-[0.1rem]">
              <BreathLight
                color={
                  record?.wpapp_site_status !== 'off' ? '#84cc16' : '#f43f5e'
                }
              />
            </div>
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
            <Tooltip placement="bottom" title="變更域名 ( domain name )">
              <EditOutlined
                onClick={showModal(record)}
                className="text-primary"
              />
            </Tooltip>
            <ToggleSslButton record={record} notificationApi={api} />
            <ToggleSiteButton record={record} notificationApi={api} />
          </div>
        )
      },
    },
  ]
  return (
    <>
      {contextHolder}
      <Table rowKey="ID" tableLayout="auto" columns={columns} {...tableProps} />
      <Modal
        centered
        title="變更域名 ( domain name )"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={
          <Button
            type="primary"
            danger
            onClick={handleChangeDomain}
            className="mr-0"
          >
            確認變更域名 ( domain name )
          </Button>
        }
      >
        <Form form={form} layout="vertical" className="mt-8">
          <Alert
            message="提醒："
            description="請先將網域DNS設定中的A紀錄(A Record) 指向 [ip]，再變更網域"
            type="info"
            showIcon
          />
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
            <Input placeholder="請輸入新的 domain name" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
