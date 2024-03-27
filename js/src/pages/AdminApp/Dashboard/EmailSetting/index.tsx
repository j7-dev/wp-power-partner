import { useState, useEffect } from 'react'
import { Input, Spin, Tag, Tooltip, message } from 'antd'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { TBase } from 'types'
import { snake, siteUrl } from '@/utils'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { AxiosResponse } from 'axios'

type TEmail = {
  status: number
  message: string
  data: {
    subject: string
    body: string
  }
}

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

const REDUX_OPT_NAME = 'power_plugins_settings'
const EMAIL_SUBJECT_FIELD_NAME = `${snake}_email_subject`
const EMAIL_BODY_FIELD_NAME = `${snake}_email_body`
const DEFAULT_SUBJECT = '網站已開通'
const DEFAULT_BODY = `
<p>嗨 ##FIRST_NAME##</p><p>你的網站開好囉，<a href="https://cloud.luke.cafe/docs" rel="noopener noreferrer" target="_blank">點此可以打開網站的使用說明書</a>，建議把基礎的都看完</p><p>如果是下單SIMPLE網站，說明書還在建置中，暫時先看POWER網站的</p><p>另外如果要將網站換成正式的網域，請參考<a href="https://cloud.luke.cafe/docs/domain-change/" rel="noopener noreferrer" target="_blank">這篇教學</a></p><p>有網站的問題都可以直接回覆這封信，或是到<a href="https://cloud.luke.cafe/" rel="noopener noreferrer" target="_blank">站長路可網站</a>的右下角對話框私訊</p><p>&nbsp;</p><p>以下是你的網站資訊</p><p>網站暫時網址：</p><p>##FRONTURL##</p><p>之後可換成你自己的網址</p><p>網站後台：</p><p>##ADMINURL##</p><p>帳號：</p><p>##SITEUSERNAME##</p><p>密碼：</p><p>##SITEPASSWORD##</p><p>進去後請記得改成自己的密碼喔</p><p>網站列表 + 進階設置：</p><p>##WORDPRESSAPPWCSITESACCOUNTPAGE##</p><p>網站主機ip：</p><p>##IPV4##</p><p>&nbsp;</p><p>這封信很重要，不要刪掉，這樣之後才找得到喔～</p><p>有問題請直接回覆這封信：）</p><p>&nbsp;</p><p>站長路可</p>
`

const index = () => {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [messageApi, contextHolder] = message.useMessage()
  const { data: email, isLoading } = useQuery<AxiosResponse<TEmail>>({
    queryKey: ['customer_notification'],
    queryFn: () =>
      axios.get(`${siteUrl}/wp-json/power-partner/customer-notification`),
  })

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

  useEffect(() => {
    if (!isLoading) {
      setSubject(email?.data?.data?.subject || DEFAULT_SUBJECT)
      setBody(email?.data?.data?.body || DEFAULT_BODY)
    }
  }, [isLoading])

  return (
    <Spin spinning={isLoading}>
      {contextHolder}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="max-w-[600px] w-full">
          <p className="mt-0 mb-2 text-[14px]">信件主旨</p>
          <Input
            value={subject}
            onChange={(e) => setSubject(e?.target?.value)}
            name={`${REDUX_OPT_NAME}[${EMAIL_SUBJECT_FIELD_NAME}]`}
          />

          <p className="mt-8 mb-2 text-[14px]">信件內文</p>
          <div className="mb-16">
            <ReactQuill
              className="h-[500px]"
              theme="snow"
              value={body}
              onChange={setBody}
            />
            <Input
              hidden
              className="hidden"
              value={body}
              name={`${REDUX_OPT_NAME}[${EMAIL_BODY_FIELD_NAME}]`}
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
    </Spin>
  )
}

export default index
