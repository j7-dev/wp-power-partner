import { Avatar, Dropdown, MenuProps, Tooltip } from 'antd'
import {
  identityAtom,
  globalLoadingAtom,
  defaultIdentity,
} from '@/pages/AdminApp/atom'
import { useAtomValue, useAtom } from 'jotai'
import {
  UserOutlined,
  PoweroffOutlined,
  MailOutlined,
  PayCircleFilled,
  CrownFilled,
} from '@ant-design/icons'
import { LOCALSTORAGE_ACCOUNT_KEY } from '@/utils'
import { LoadingText } from '@/components'

const index = () => {
  const [identity, setIdentity] = useAtom(identityAtom)
  const powerMoney = identity.data?.power_money_amount || '0.00'
  const email = identity.data?.email
  const user_id = identity.data?.user_id || ''
  const partnerLvTitle = identity.data?.partner_lv?.title || ''
  const partnerLvKey = identity.data?.partner_lv?.key || '0'
  const globalLoading = useAtomValue(globalLoadingAtom)

  const handleDisconnect = () => {
    localStorage.removeItem(LOCALSTORAGE_ACCOUNT_KEY)
    setIdentity(defaultIdentity)
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
    <div className="mr-4 flex items-center">
      {partnerLvTitle && (
        <Tooltip
          title={
            partnerLvKey === '2'
              ? '您已是最高階經銷商'
              : '升級為高階經銷商，享受更高主機折扣'
          }
          className="mr-8"
        >
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://cloud.luke.cafe"
          >
            <CrownFilled
              className={`mr-2 text-lg ${
                partnerLvKey === '2' ? 'text-yellow-500' : 'text-gray-300'
              }`}
            />
            <LoadingText
              isLoading={globalLoading?.isLoading}
              content={<span className="text-gray-800">{partnerLvTitle}</span>}
            />
          </a>
        </Tooltip>
      )}

      <Tooltip title="前往儲值" className="mr-8">
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://cloud.luke.cafe"
        >
          <span className="text-yellow-500 font-bold">￥</span>{' '}
          <LoadingText
            isLoading={globalLoading?.isLoading}
            content={<span className="text-gray-800">{powerMoney}</span>}
          />
        </a>
      </Tooltip>

      <Dropdown menu={{ items }} placement="bottomRight" trigger={['click']}>
        <Avatar
          className="cursor-pointer"
          style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}
        >
          {(email || 'u').charAt(0).toUpperCase()}
        </Avatar>
      </Dropdown>
    </div>
  )
}

export default index
