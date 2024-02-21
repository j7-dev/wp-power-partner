import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

import { useGetUsermetaIdentity } from '@/pages/hooks'

import { Spin } from 'antd'

function DefaultPage() {
  return (
    <div className="w-full min-h-[24rem] grid place-items-center">
      <Login />
    </div>
  )

  const { data, isLoading } = useGetUsermetaIdentity()

  const accountInfo = data?.data?.data

  if (isLoading) {
    return (
      <div className="w-full min-h-[24rem] grid place-items-center">
        <Spin tip="Loading..." size="large" />
      </div>
    )
  }

  if (!accountInfo) {
    return (
      <div className="w-full min-h-[24rem] grid place-items-center">
        <Login />
      </div>
    )
  }

  return <Dashboard />
}

export default DefaultPage
