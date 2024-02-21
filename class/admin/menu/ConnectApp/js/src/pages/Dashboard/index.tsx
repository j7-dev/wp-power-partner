import React from 'react'
import { MoneyCollectOutlined, ClusterOutlined } from '@ant-design/icons'
import { Tabs, TabsProps } from 'antd'
import AccountIcon from './AccountIcon'
import SiteList from './SiteList'
import LogList from './LogList'

const index: React.FC = () => {
  const items: TabsProps['items'] = [
    {
      key: 'siteList',
      icon: <ClusterOutlined />,
      label: '所有站台',
      children: <SiteList />,
    },
    {
      key: 'logList',
      icon: <MoneyCollectOutlined />,
      label: '點數 Log',
      children: <LogList />,
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
