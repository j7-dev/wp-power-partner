import React, { useState } from 'react'
import {
	MoneyCollectOutlined,
	ClusterOutlined,
	InfoCircleOutlined,
	MailOutlined,
	CodeOutlined,
	BarcodeOutlined,
	SettingOutlined,
} from '@ant-design/icons'
import { Tabs, TabsProps, Form, Button } from 'antd'
import AccountIcon from './AccountIcon'
import SiteList from './SiteList'
import LogList from './LogList'
import Description from './Description'
import EmailSetting from './EmailSetting'
import ManualSiteSync from './ManualSiteSync'
import Settings from './Settings'
import LicenseCodes from './LicenseCodes'
import useSave, {
	TFormValues,
} from '@/pages/AdminApp/Dashboard/EmailSetting/hooks/useSave'

import { windowWidth } from '@/utils'

const items: TabsProps['items'] = [
	{
		key: 'siteList',
		icon: <ClusterOutlined />,
		label: '所有站台',
		children: <SiteList />,
		forceRender: false,
	},
	{
		key: 'logList',
		icon: <MoneyCollectOutlined />,
		label: '點數 Log',
		children: <LogList />,
		forceRender: false,
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
		key: 'settings',
		icon: <SettingOutlined />,
		label: '設定',
		children: <Settings />,
		forceRender: true,
	},
	{
		key: 'license-codes',
		icon: <BarcodeOutlined />,
		label: '授權碼管理',
		children: <LicenseCodes />,
		forceRender: false,
	},
	{
		key: 'description',
		icon: <InfoCircleOutlined />,
		label: '其他資訊',
		children: <Description />,
		forceRender: false,
	},
]

const index = () => {
	const [form] = Form.useForm()
	const { mutation, contextHolder } = useSave(form)
	const { mutate: saveSettings, isPending } = mutation
	const [activeKey, setActiveKey] = useState<string>('license-codes')

	const handleSave = () => {
		form
			.validateFields()
			.then((settings: TFormValues) => {
				saveSettings(settings)
			})
			.catch((error) => {
				console.log(error)
			})
	}
	return (
		<Form form={form}>
			{contextHolder}
			<Tabs
				activeKey={activeKey}
				onChange={setActiveKey}
				className={`${windowWidth < 1200 ? 'mt-16' : ''}`}
				type="card"
				tabBarExtraContent={<AccountIcon />}
				items={items}
			/>
			{['email', 'settings'].includes(activeKey) && (
				<Button
					type="primary"
					className="mt-4"
					onClick={handleSave}
					loading={isPending}
				>
					儲存
				</Button>
			)}
		</Form>
	)
}

export default index
