import AdminApp from './pages/AdminApp'
import { createCache, StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'
import '@/assets/scss/index.scss'

function App() {
	const cache = createCache()
	return (
		<StyleProvider cache={cache} hashPriority="high">
			<ConfigProvider
				theme={{
					components: {
						Table: {
							rowExpandedBg: '#ffffff',
						},
					},
				}}
			>
				<AdminApp />
			</ConfigProvider>
		</StyleProvider>
	)
}

export default App
