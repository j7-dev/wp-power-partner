import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import { useGetUserIdentity } from '@/pages/hooks'
import { Spin } from 'antd'
import { globalLoadingAtom, identityAtom } from './atom'
import { useAtomValue } from 'jotai'

function DefaultPage() {
  const mutation = useGetUserIdentity()
  const globalLoading = useAtomValue(globalLoadingAtom)
  const identity = useAtomValue(identityAtom)
  const identityData = identity?.data
  const status = identity?.status

  return (
    <div className="flex min-h-[24rem]">
      <Spin
        size="large"
        wrapperClassName="w-full"
        spinning={globalLoading?.isLoading || mutation?.isLoading}
        tip={globalLoading?.isLoading ? globalLoading?.label : 'Loading...'}
      >
        {status === 200 && identityData ? <Dashboard /> : <Login />}
      </Spin>
    </div>
  )
}

export default DefaultPage
