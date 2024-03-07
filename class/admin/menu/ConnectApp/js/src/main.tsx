import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { renderId1, renderId2 } from '@/utils'
import { StyleProvider } from '@ant-design/cssinjs'

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

const id1s = document.querySelectorAll(renderId1)
const id2s = document.querySelectorAll(renderId2)

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
      ReactDOM.createRoot(el).render(
        <React.StrictMode>
          <QueryClientProvider client={queryClient}>
            <StyleProvider hashPriority="high">
              <App />
            </StyleProvider>
            <ReactQueryDevtools initialIsOpen={true} />
          </QueryClientProvider>
        </React.StrictMode>,
      )
    })
  }
})
