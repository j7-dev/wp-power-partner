import {
  Tag,
  Tooltip,
  message,
  Table,
  TableColumnsType,
  Input,
  Form,
  Button,
  Affix,
} from 'antd'
import SendingCondition from '@/pages/AdminApp/Dashboard/EmailSetting/SendingCondition'
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import {
  REDUX,
  tokens,
  handleCopy,
  getEmailTemplate,
} from '@/pages/AdminApp/Dashboard/EmailSetting/utils'
import EmailBody from '@/pages/AdminApp/Dashboard/EmailSetting/EmailBody'
import DeleteButton from '@/pages/AdminApp/Dashboard/EmailSetting/DeleteButton'
import EmailSwitch from '@/pages/AdminApp/Dashboard/EmailSetting/EmailSwitch'
import { emailsAtom } from '@/pages/AdminApp/Dashboard/EmailSetting/atom'
import { useAtom } from 'jotai'
import useSave from '@/pages/AdminApp/Dashboard/EmailSetting/hooks/useSave'
import useGetEmails from '@/pages/AdminApp/Dashboard/EmailSetting/hooks/useGetEmails'

const { Item } = Form

const columns: TableColumnsType<DataType> = [
  {
    title: '啟用',
    width: 77,
    dataIndex: 'enabled',
    render: (_value: boolean, record, index) => (
      <EmailSwitch record={record} index={index} />
    ),
  },
  {
    title: '主旨',

    // width: '100%',

    dataIndex: 'subject',
    render: (value: string, _record, index) => (
      <Item
        name={[index, REDUX.SUBJECT_FIELD_NAME]}
        initialValue={value}
        className="mb-0"
        shouldUpdate
      >
        <Input />
      </Item>
    ),
  },
  {
    title: '時機',
    width: 422,
    dataIndex: 'condition',
    render: (_value: string, record, index) => (
      <SendingCondition record={record} index={index} />
    ),
  },
  {
    title: '',
    width: 46,
    dataIndex: 'action',
    render: (_value: string, record) => <DeleteButton record={record} />,
  },
]

const EmailSetting = () => {
  const [form] = Form.useForm()
  const [messageApi, contextHolder] = message.useMessage()
  const [dataSource, setDataSource] = useAtom(emailsAtom)
  console.log('⭐  dataSource:', dataSource)

  const handleAdd = () => {
    setDataSource([
      ...dataSource,
      getEmailTemplate(),
    ])
  }

  const { isLoading } = useGetEmails()
  const { contextHolder: notificationContextHolder } = useSave(form)

  return (
    <Form form={form}>
      {contextHolder}
      {notificationContextHolder}
      <div className="flex flex-col lg:flex-row gap-8 relative">
        <div className="w-full">
          <Table
            rowKey="key"
            tableLayout="auto"
            columns={columns}
            expandable={{
              expandedRowRender: (record, index) => (
                <EmailBody record={record} index={index} />
              ),
            }}
            dataSource={dataSource}
            pagination={false}
            loading={isLoading}
          />
          <Button type="dashed" className="mt-4 w-full" onClick={handleAdd}>
            新增 Email
          </Button>
        </div>
        <div className="flex-1 max-w-[400px] sticky top-0">
          <Affix offsetTop={48}>
            <p className="mb-2 text-[14px]">可用變數</p>
            {tokens.map((token) => (
              <Tooltip key={token?.value} title={token?.label}>
                <Tag
                  color="#eee"
                  className="rounded-xl text-gray-600 px-3 cursor-pointer mb-2"
                  onClick={handleCopy(token, messageApi)}
                >
                  {token?.value}
                </Tag>
              </Tooltip>
            ))}
          </Affix>
        </div>
      </div>
    </Form>
  )
}

export default EmailSetting
