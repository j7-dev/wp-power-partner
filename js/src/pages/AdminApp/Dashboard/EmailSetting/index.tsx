import { useState } from 'react'
import { Form, Input, Tag, Tooltip, message } from 'antd'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { TBase } from 'types'

const tokens: TBase[] = [
  {
    label: '姓',
    value: '##FIRST_NAME##',
  },
  {
    label: '名',
    value: '##LAST_NAME##',
  },
  {
    label: '暱稱',
    value: '##NICE_NAME##',
  },
  {
    label: 'Email',
    value: '##EMAIL##',
  },
  {
    label: 'WordPress帳戶頁',
    value: '##WORDPRESSAPPWCSITESACCOUNTPAGE##',
  },
  {
    label: 'IPV4',
    value: '##IPV4##',
  },
  {
    label: '網域',
    value: '##DOMAIN##',
  },
  {
    label: '前台網址',
    value: '##FRONTURL##',
  },
  {
    label: '後台網址',
    value: '##ADMINURL##',
  },
  {
    label: '網站帳號',
    value: '##SITEUSERNAME##',
  },
  {
    label: '網站密碼',
    value: '##SITEPASSWORD##',
  },
]

const index = () => {
  const [value, setValue] = useState('')
  const [messageApi, contextHolder] = message.useMessage()
  const handleCopy = (token: TBase) => () => {
    if (!navigator.clipboard) {
      messageApi.open({
        type: 'error',
        content: `剪貼簿不可用，請手動複製 ${token.label}`,
      })
      return
    }

    navigator?.clipboard
      ?.writeText(token.value)
      .then(() => {
        messageApi.open({
          type: 'success',
          content: `已複製 ${token.label} 至剪貼簿`,
        })
      })
      .catch((err) => {
        messageApi.open({
          type: 'error',
          content: `複製 ${token.label} 時出錯了，請再試一次`,
        })
        console.error('Error in copying text: ', err)
      })
  }

  return (
    <>
      {contextHolder}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="max-w-[600px] w-full">
          <Form layout="vertical">
            <Form.Item label="信件主旨">
              <Input />
            </Form.Item>
          </Form>
          <p className="mt-0 mb-2 text-[14px]">信件內文</p>
          <div className="mb-16">
            <ReactQuill
              className="h-[500px]"
              theme="snow"
              value={value}
              onChange={setValue}
            />
          </div>
        </div>
        <div className="flex-1 max-w-[400px]">
          <p className="mb-2 text-[14px]">可用變數</p>
          {tokens.map((token) => (
            <Tooltip key={token?.value} title={token?.label}>
              <Tag
                color="#eee"
                className="rounded-xl text-gray-600 px-3 cursor-pointer mb-2"
                onClick={handleCopy(token)}
              >
                {token?.value}
              </Tag>
            </Tooltip>
          ))}
        </div>
      </div>
    </>
  )
}

export default index
