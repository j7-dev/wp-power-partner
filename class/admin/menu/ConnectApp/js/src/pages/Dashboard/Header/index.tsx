import { Layout, Button, Avatar, theme, Dropdown, MenuProps } from 'antd'
import { isSiderCollapsedAtom, identityAtom } from '@/pages/atom'
import { useAtom, useAtomValue } from 'jotai'
import {
  UserOutlined,
  PoweroffOutlined,
  MailOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PayCircleFilled,
} from '@ant-design/icons'
import { useUpdate } from '@/hooks'
import { currentUserId, snake } from '@/utils'
import { useQueryClient } from '@tanstack/react-query'

const { Header } = Layout

const index = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken()
  const queryClient = useQueryClient()

  const [isSiderCollapsed, setIsSiderCollapsed] = useAtom(isSiderCollapsedAtom)
  const identity = useAtomValue(identityAtom)
  const powerMoney = identity.data?.power_money_amount || '0.00'
  const email = identity.data?.email
  const user_id = identity.data?.user_id || ''

  const { mutate: updateUser, isLoading: updateUserIsLoading } = useUpdate({
    resource: `users/${currentUserId}`,
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-user-identity'])
      },
    },
  })

  const handleDisconnect = () => {
    updateUser({
      meta: {
        [`${snake}_identity`]: '',
      },
    })
  }

  const items: MenuProps['items'] = [
    {
      key: 'user_id',
      label: `#${user_id}`,
      icon: <UserOutlined />,
    },
    {
      key: 'email',
      label: <span className="text-xs">{email || ''}</span>,
      icon: <MailOutlined />,
    },
    {
      key: 'deposit',
      label: (
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://cloud.luke.cafe"
        >
          前往儲值
        </a>
      ),
      icon: <PayCircleFilled className="text-yellow-500" />,
    },
    {
      type: 'divider',
    },
    {
      key: 'disconnect',
      label: <span onClick={handleDisconnect}>解除帳號綁定</span>,
      icon: <PoweroffOutlined />,
    },
  ]

  return (
    <Header style={{ padding: 0, background: colorBgContainer }}>
      <div className="flex justify-between">
        <Button
          type="text"
          icon={
            isSiderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
          }
          onClick={() => setIsSiderCollapsed(!isSiderCollapsed)}
          style={{
            fontSize: '16px',
            width: 64,
            height: 64,
          }}
        />
        <div className="mr-4 flex items-center">
          <div className="mr-8">
            <span className="text-yellow-500 font-bold">￥</span> {powerMoney}
          </div>
          <Dropdown
            menu={{ items }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Avatar
              className="cursor-pointer"
              style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
            >
              {(email || 'u').charAt(0).toUpperCase()}
            </Avatar>
          </Dropdown>
        </div>
      </div>
    </Header>
  )
}

export default index
