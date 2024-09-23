import styles from '@/assets/scss/index.scss?inline'
import UserApp from '@/pages/UserApp'
import { extractStyle } from '@ant-design/static-style-extract'
import root from 'react-shadow'

function App2() {
	const antdCss = extractStyle()

	return (
		<root.div>
			<UserApp />
			<style type="text/css">
				{styles}
				{antdCss}
			</style>
		</root.div>
	)
}

export default App2
