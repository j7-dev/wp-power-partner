import AdminApp from './pages/AdminApp'
import styles from '@/assets/scss/index.scss?inline'
import { createCache, StyleProvider } from '@ant-design/cssinjs'
import root from 'react-shadow'
import { useEffect, useRef, useState } from 'react'

function App() {
	const cache = createCache()
	const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
	const shadowRootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		setShadowRoot(shadowRootRef?.current?.shadowRoot as ShadowRoot)
	}, [shadowRootRef])

	return (
		<root.div>
			<style type="text/css">{styles}</style>
			<StyleProvider cache={cache} container={shadowRoot as ShadowRoot}>
				<AdminApp />
			</StyleProvider>
		</root.div>
	)
}

export default App
