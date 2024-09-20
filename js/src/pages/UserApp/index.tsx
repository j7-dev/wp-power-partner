import SiteList from '@/pages/UserApp/SiteList'
import { useGetUserIdentity } from '@/pages/UserApp/hooks/useGetUserIdentity'
import { currentUserId, windowWidth } from '@/utils'
import { globalLoadingAtom, identityAtom } from '@/pages/UserApp/atom'
import { useAtomValue } from 'jotai'
import { Spin, Tabs, TabsProps } from 'antd'
import { ClusterOutlined, BarcodeOutlined } from '@ant-design/icons'
import LicenseCodes from '@/pages/AdminApp/Dashboard/LicenseCodes'

const items: TabsProps['items'] = [
	{
		key: 'siteList',
		icon: <ClusterOutlined />,
		label: '所有站台',
		children: <SiteList />,
		forceRender: false,
	},
	{
		key: 'license-codes',
		icon: <BarcodeOutlined />,
		label: '授權碼',
		children: <LicenseCodes />,
		forceRender: false,
	},
]

const index = () => {
	const { isPending } = useGetUserIdentity()

	if (!currentUserId) {
		return <p>請先登入以便查看站台資訊</p>
	}

	const globalLoading = useAtomValue(globalLoadingAtom)
	const identity = useAtomValue(identityAtom)
	const identityData = identity?.data
	const status = identity?.status

	return (
		<div className="flex min-h-[12rem]">
			<Spin
				size="large"
				wrapperClassName="w-full"
				spinning={globalLoading?.isLoading || isPending}
				tip={globalLoading?.isLoading ? globalLoading?.label : 'Loading...'}
			>
				{status === 200 && identityData && (
					<Tabs
						className={`${windowWidth < 1200 ? 'mt-16' : ''}`}
						type="card"
						items={items}
					/>
				)}

				{(status === 500 || !identityData) && (
					<p>OOPS! something went wrong! </p>
				)}
			</Spin>
		</div>
	)
}

export default index
