import { Avatar, Dropdown, MenuProps, Tooltip, Button, Form } from 'antd'
import {
	identityAtom,
	globalLoadingAtom,
	defaultIdentity,
} from '@/pages/AdminApp/atom'
import { useAtom } from 'jotai'
import {
	UserOutlined,
	PoweroffOutlined,
	MailOutlined,
	SyncOutlined,
	CrownFilled,
} from '@ant-design/icons'
import { LOCALSTORAGE_ACCOUNT_KEY, windowWidth } from '@/utils'
import { LoadingText } from '@/components'
import { axios } from '@/api'
import { useQueryClient } from '@tanstack/react-query'
import useFormInstance from 'antd/es/form/hooks/useFormInstance'

const DEPOSIT_LINK = 'https://cloud.luke.cafe/product/power-partner/'

type TFormValues = {
	power_partner_disable_site_after_n_days: number
	emails: {
		subject: string
		key: string
		body: string
		enabled: boolean
		action_name: string
		days: number
		operator: string
	}[]
}

const index = () => {
	const [identity, setIdentity] = useAtom(identityAtom)
	const powerMoney = identity.data?.power_money_amount || '0.00'
	const email = identity.data?.email
	const user_id = identity.data?.user_id || ''
	const partnerLvTitle = identity.data?.partner_lv?.title || ''
	const partnerLvKey = identity.data?.partner_lv?.key || '0'
	const [globalLoading, setGlobalLoading] = useAtom(globalLoadingAtom)
	const queryClient = useQueryClient()

	const handleDisconnect = async () => {
		setGlobalLoading({
			isLoading: true,
			label: '正在解除帳號綁定...',
		})
		try {
			await axios.delete('/power-partner/partner-id')
		} catch (error) {
			console.log('error', error)
		}
		localStorage.removeItem(LOCALSTORAGE_ACCOUNT_KEY)
		setIdentity(defaultIdentity)
		setGlobalLoading({
			isLoading: false,
			label: '',
		})
	}

	const items: MenuProps['items'] = [
		{
			key: 'user_id',
			label: `#${user_id}`,
			icon: <UserOutlined />,
		},
		{
			key: 'partner_lv',
			label: (
				<a target="_blank" rel="noopener noreferrer" href={DEPOSIT_LINK}>
					<LoadingText
						isLoading={globalLoading?.isLoading}
						content={<span className="text-gray-800">{partnerLvTitle}</span>}
					/>
				</a>
			),
			icon: (
				<CrownFilled
					className={`${
						partnerLvKey === '2' ? 'text-yellow-500' : 'text-gray-300'
					}`}
				/>
			),
		},
		{
			key: 'deposit',
			label: (
				<a target="_blank" rel="noopener noreferrer" href={DEPOSIT_LINK}>
					<LoadingText
						isLoading={globalLoading?.isLoading}
						content={<span className="text-gray-800">{powerMoney}</span>}
					/>
				</a>
			),
			icon: <span className="text-yellow-500 font-bold">￥</span>,
		},
		{
			key: 'email',
			label: <span className="text-xs">{email || ''}</span>,
			icon: <MailOutlined />,
		},
		{
			type: 'divider',
		},
		{
			key: 'disconnect',
			label: <span onClick={handleDisconnect}>解除帳號綁定</span>,
			icon: <PoweroffOutlined className="text-red-500" />,
		},
	]

	const filterItems = items.filter((item) => {
		if (windowWidth < 1200) {
			return true
		}
		return !['partner_lv', 'deposit'].includes((item?.key || '') as string)
	})

	const handleRefetch = () => {
		queryClient.invalidateQueries({
			queryKey: ['apps'],
		})
		queryClient.invalidateQueries({
			queryKey: ['logs'],
		})
	}

	const form = useFormInstance()
	const handleSave = () => {
		form
			.validateFields()
			.then((values: TFormValues) => {
				console.log(values)
			})
			.catch((error) => {
				console.log(error)
			})
	}

	return (
		<div className={'ml-4 xl:mr-4 flex items-center gap-4 xl:gap-8'}>
			<Button size="small" type="primary" onClick={handleSave}>
				儲存
			</Button>
			<Tooltip title="刷新資料">
				<SyncOutlined spin={globalLoading?.isLoading} onClick={handleRefetch} />
			</Tooltip>

			{partnerLvTitle && windowWidth >= 1280 && (
				<Tooltip
					title={
						partnerLvKey === '2'
							? '您已是最高階經銷商'
							: '升級為高階經銷商，享受更高主機折扣'
					}
				>
					<a target="_blank" rel="noopener noreferrer" href={DEPOSIT_LINK}>
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

			{windowWidth >= 1280 && (
				<Tooltip title="前往儲值">
					<a target="_blank" rel="noopener noreferrer" href={DEPOSIT_LINK}>
						<span className="text-yellow-500 font-bold">￥</span>{' '}
						<LoadingText
							isLoading={globalLoading?.isLoading}
							content={<span className="text-gray-800">{powerMoney}</span>}
						/>
					</a>
				</Tooltip>
			)}

			<Dropdown
				menu={{ items: filterItems }}
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
	)
}

export default index
