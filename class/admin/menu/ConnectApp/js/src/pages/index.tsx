import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

import { useGetUsermetaIdentity } from '@/pages/hooks'

import { Spin } from 'antd'

function DefaultPage() {
  // TODO 要拿掉

  return <Dashboard />

  const { data, isLoading } = useGetUsermetaIdentity()

  const accountInfo = data?.data?.data

  if (isLoading) {
    return <Spin tip="Loading..." size="large" />
  }

  if (!accountInfo) {
    return <Login />
  }

  return <Dashboard />
}

export default DefaultPage
