import React from 'react'
import {
  MoneyCollectOutlined,
  ClusterOutlined,
  InfoCircleOutlined,
  MailOutlined,
  CodeOutlined,
} from '@ant-design/icons'
import { Tabs, TabsProps } from 'antd'
import AccountIcon from './AccountIcon'
import SiteList from './SiteList'
import LogList from './LogList'
import Description from './Description'
import EmailSetting from './EmailSetting'
import ManualSiteSync from './ManualSiteSync'

const index: React.FC = () => {
  const items: TabsProps['items'] = [
    {
      key: 'siteList',
      icon: <ClusterOutlined />,
      label: '所有站台',
      children: <SiteList />,
      forceRender: true,
    },
    {
      key: 'logList',
      icon: <MoneyCollectOutlined />,
      label: '點數 Log',
      children: <LogList />,
      forceRender: true,
    },
    {
      key: 'email',
      icon: <MailOutlined />,
      label: 'Email 設定',
      children: <EmailSetting />,
      forceRender: true,
    },
    {
      key: 'manualSiteSync',
      icon: <CodeOutlined />,
      label: '手動開站',
      children: <ManualSiteSync />,
      forceRender: true,
    },
    {
      key: 'description',
      icon: <InfoCircleOutlined />,
      label: '其他資訊',
      children: <Description />,
      forceRender: true,
    },
  ]

  return (
    <Tabs
      type="card"
      tabBarExtraContent={<AccountIcon />}
      defaultActiveKey="siteList"
      items={items}
    />
  )
}

export default index
