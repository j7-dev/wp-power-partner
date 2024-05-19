import React, { FC } from 'react'
import {
  DataTypeWithSubscriptionIds as DataType,
  TGetCustomersResponse,
} from '@/components/SiteListTable/types'
import { UseQueryResult } from '@tanstack/react-query'
import { siteUrl } from '@/utils'

const index: FC<{
  record: DataType
  customerResult: UseQueryResult<TGetCustomersResponse, Error>
  isAdmin?: boolean
}> = ({ record, customerResult, isAdmin = false }) => {
  const customers = customerResult.data?.data || []
  const findCustomer = customers.find(
    (customer) => customer.id === record.customer_id,
  )
  const isFetching = customerResult?.isFetching

  if (isFetching) {
    return (
      <div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
        {isAdmin && (
          <>
            <span className="bg-gray-200 px-2">user id</span>
            <span className="place-self-end bg-gray-200 w-24 h-4 rounded animate-pulse"></span>
          </>
        )}
        <span className="bg-gray-200 px-2">用戶名稱</span>
        <span className="place-self-end bg-gray-200 w-24 h-4 rounded animate-pulse"></span>
        <span className="bg-gray-200 px-2">用戶帳號</span>
        <span className="place-self-end bg-gray-200 w-24 h-4 rounded animate-pulse"></span>
        <span className="bg-gray-200 px-2">Email</span>
        <span className="place-self-end bg-gray-200 w-24 h-4 rounded animate-pulse"></span>
      </div>
    )
  }

  if (!findCustomer) {
    return (
      <div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
        {isAdmin && (
          <>
            <span className="bg-gray-200 px-2">user id</span>
            <span className="place-self-end">找不到用戶資料</span>
          </>
        )}
        <span className="bg-gray-200 px-2">用戶名稱</span>
        <span className="place-self-end">找不到用戶資料</span>
        <span className="bg-gray-200 px-2">用戶帳號</span>
        <span className="place-self-end">找不到用戶資料</span>
        <span className="bg-gray-200 px-2">Email</span>
        <span className="place-self-end">找不到用戶資料</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[4rem_8rem] gap-1 text-xs">
      {isAdmin && (
        <>
          <span className="bg-gray-200 px-2">user id</span>
          <a
            className="place-self-end"
            href={`${siteUrl}/wp-admin/user-edit.php?user_id=${findCustomer?.id}&wp_http_referer=%2Fwp-admin%2Fusers.php`}
            target="_blank"
            rel="noreferrer"
          >
            #{findCustomer?.id}
          </a>
        </>
      )}
      <span className="bg-gray-200 px-2">用戶名稱</span>
      <span className="place-self-end">{findCustomer?.display_name}</span>
      <span className="bg-gray-200 px-2">用戶帳號</span>
      <span className="place-self-end">{findCustomer?.user_login}</span>
      <span className="bg-gray-200 px-2">Email</span>
      <span className="place-self-end">{findCustomer?.user_email}</span>
    </div>
  )
}

export default index
