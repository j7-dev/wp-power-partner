import React from 'react'
import { MoneyCollectOutlined, ClusterOutlined } from '@ant-design/icons'
import { Layout, Menu, theme } from 'antd'
import { isSiderCollapsedAtom } from '@/pages/atom'
import { useAtomValue } from 'jotai'
import Header from './Header'

const { Sider, Content } = Layout

const index: React.FC = () => {
  const isSiderCollapsed = useAtomValue(isSiderCollapsedAtom)
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <Layout>
      <Sider trigger={null} collapsible collapsed={isSiderCollapsed}>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              icon: <ClusterOutlined />,
              label: '站台查詢',
            },
            {
              key: '2',
              icon: <MoneyCollectOutlined />,
              label: '點數查詢',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header />
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            height: 'calc(100vh - 5rem)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          Content
        </Content>
      </Layout>
    </Layout>
  )
}

export default index
