import SiteList from '@/pages/UserApp/SiteList'
import { useGetUserIdentity } from '@/pages/UserApp/hooks/useGetUserIdentity'
import { currentUserId } from '@/utils'
import { globalLoadingAtom, identityAtom } from '@/pages/UserApp/atom'
import { useAtomValue } from 'jotai'
import { Spin } from 'antd'

const index = () => {
  const { isLoading } = useGetUserIdentity()

  if (!currentUserId) {
    return <p>請先登入以便查看站台資訊</p>
  }

  const globalLoading = useAtomValue(globalLoadingAtom)
  const identity = useAtomValue(identityAtom)
  const identityData = identity?.data
  const status = identity?.status

  return (
    <div className="flex min-h-[12rem]">
      <Spin
        size="large"
        wrapperClassName="w-full"
        spinning={globalLoading?.isLoading || isLoading}
        tip={globalLoading?.isLoading ? globalLoading?.label : 'Loading...'}
      >
        {status === 200 && identityData ? (
          <SiteList />
        ) : (
          <p>OOPS! something went wrong! </p>
        )}
      </Spin>
    </div>
  )
}

export default index
