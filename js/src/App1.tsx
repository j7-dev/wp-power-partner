import AdminApp from './pages/AdminApp'
import { StyleProvider } from '@ant-design/cssinjs'
import '@/assets/scss/index.scss'

function App() {
	return (
		<StyleProvider hashPriority="high">
			<AdminApp />
		</StyleProvider>
	)
}

export default App
