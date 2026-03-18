import { CloudOutlined, GlobalOutlined } from '@ant-design/icons'
import { Tabs, TabsProps } from 'antd'
import { useAtomValue } from 'jotai'

import {
	EPowercloudIdentityStatusEnum,
	powercloudIdentityAtom,
} from '@/pages/AdminApp/Atom/powercloud.atom'

import Powercloud from './Powercloud'
import WPCD from './WPCD'

const index = () => {
	const powercloudIdentity = useAtomValue(powercloudIdentityAtom)
	const hasPowerCloudApiKey =
		powercloudIdentity.status === EPowercloudIdentityStatusEnum.LOGGED_IN &&
		!!powercloudIdentity.apiKey

	if (!hasPowerCloudApiKey) {
		return <WPCD />
	}

	const siteTypeItems: TabsProps['items'] = [
		{
			key: 'powercloud',
			icon: <CloudOutlined />,
			label: '新架構',
			children: <Powercloud />,
			forceRender: false,
		},
		{
			key: 'wpcd',
			icon: <GlobalOutlined />,
			label: '舊架構',
			children: <WPCD />,
			forceRender: false,
		},
	]

	return <Tabs items={siteTypeItems} />
}

export default index
