import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { app1Selector, app2Selector } from '@/utils'
import { StyleProvider } from '@ant-design/cssinjs'
import { ConfigProvider } from 'antd'

const App1 = React.lazy(() => import('./App1'))
const App2 = React.lazy(() => import('./App2'))

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 0,
		},
	},
})

const id1s = document.querySelectorAll(app1Selector)
const id2s = document.querySelectorAll(app2Selector)

const mapping = [
	{
		els: id1s,
		App: App1,
	},
	{
		els: id2s,
		App: App2,
	},
]

mapping.forEach(({ els, App }) => {
	if (!!els) {
		els.forEach((el) => {
			createRoot(el).render(
				<React.StrictMode>
					<QueryClientProvider client={queryClient}>
						<StyleProvider hashPriority="high">
							<ConfigProvider
								theme={{
									components: {
										Table: {
											rowExpandedBg: '#ffffff',
										},
									},
								}}
							>
								<App />
							</ConfigProvider>
						</StyleProvider>
						<ReactQueryDevtools initialIsOpen={true} />
					</QueryClientProvider>
				</React.StrictMode>,
			)
		})
	}
})
