import styles from '@/assets/scss/index.scss?inline'
import UserApp from '@/pages/UserApp'
import { StyleProvider } from '@ant-design/cssinjs'
import root from 'react-shadow'
import { useEffect, useRef, useState } from 'react'
import { ConfigProvider } from 'antd'

function App2() {
	const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null)
	const shadowRootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		setShadowRoot(shadowRootRef?.current?.shadowRoot as ShadowRoot)
	}, [shadowRootRef])

	return (
		<root.div ref={shadowRootRef}>
			<style type="text/css">{styles}</style>
			<StyleProvider
				container={shadowRoot as ShadowRoot}
				hashPriority="high"
			>
				<ConfigProvider
					theme={{
						components: {
							Table: {
								rowExpandedBg: '#ffffff',
							},
						},
					}}
				>
					<UserApp />
				</ConfigProvider>
			</StyleProvider>
		</root.div>
	)
}

export default App2
