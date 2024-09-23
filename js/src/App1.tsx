import AdminApp from './pages/AdminApp'
import styles from '@/assets/scss/index.scss?inline'
import { extractStyle } from '@ant-design/static-style-extract'
import root from 'react-shadow'

function App() {
	const antdCss = extractStyle()

	return (
		<root.div className="tailwind">
			<AdminApp />
			<style type="text/css">
				{styles}
				{antdCss}
			</style>
		</root.div>
	)
}

export default App
