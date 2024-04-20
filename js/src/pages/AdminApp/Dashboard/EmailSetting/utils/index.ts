/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { TBase } from '@/types'
import { MessageInstance } from 'antd/es/message/interface'
import { nanoid } from 'nanoid'

export const getEmailTemplate = () =>
  ({
    key: nanoid(),
    enabled: false,
    subject: '這裡填你的信件主旨 ##FIRST_NAME##',
    body: '<p>嗨 ##FIRST_NAME##</p><p>你的網站開好囉，<a href="https://cloud.luke.cafe/docs" rel="noopener noreferrer" target="_blank">點此可以打開網站的使用說明書</a></p><p><br></p><p>另外如果要將網站換成正式的網域，請參考<a href="https://cloud.luke.cafe/docs/domain-change/" rel="noopener noreferrer" target="_blank">這篇教學</a></p><p><br></p><p>有網站的問題都可以直接回覆這封信，或是私訊 <a href="https://wpsite.pro/" rel="noopener noreferrer" target="_blank">架站小幫手網站</a> 的右下角對話框</p><p>&nbsp;</p><p>--- 以下是你的網站資訊 ---</p><p><br></p><p>網站暫時網址：</p><p>##FRONTURL##</p><p>之後可換成你自己的網址</p><p><br></p><p>網站後台：</p><p>##ADMINURL##</p><p><br></p><p>帳號：</p><p>##SITEUSERNAME##</p><p><br></p><p>密碼：</p><p>##SITEPASSWORD##</p><p><br></p><p><strong>進去後請記得改成自己的密碼喔</strong></p><p><br></p><p>網站列表 + 進階設置：</p><p>##WORDPRESSAPPWCSITESACCOUNTPAGE##</p><br><p>網站主機ip：</p><p>##IPV4##</p><p>&nbsp;</p><p>這封信很重要，不要刪掉，這樣之後才找得到喔～</p><p>&nbsp;</p><p><br></p>',
    action_name: 'subscription_failed',
    days: 0,
    operator: 'after',
  } as DataType)

export enum REDUX {
  OPT_NAME = 'power_plugins_settings',
  OBJECT_KEY = 'power_partner_emails',
  KEY_FIELD_NAME = 'key',
  SUBJECT_FIELD_NAME = 'subject',
  ENABLED_FIELD_NAME = 'enabled',
  BODY_FIELD_NAME = 'body',
  ACTION_NAME_FIELD_NAME = 'action_name',
  DAYS_FIELD_NAME = 'days',
  OPERATOR_FIELD_NAME = 'operator',
}

export const tokens: TBase[] = [
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

export const handleCopy = (token: TBase, messageApi: MessageInstance) => () => {
  if (!navigator?.clipboard) {
    messageApi.open({
      type: 'error',
      content: `剪貼簿不可用，請手動複製 ${token.value}`,
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
