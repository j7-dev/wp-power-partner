import React from 'react'
import {
  MoneyCollectOutlined,
  ClusterOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import { Tabs, TabsProps } from 'antd'
import AccountIcon from './AccountIcon'
import SiteList from './SiteList'
import LogList from './LogList'
import Description from './Description'

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
    {
      key: 'description',
      icon: <InfoCircleOutlined />,
      label: '其他資訊',
      children: <Description />,
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
