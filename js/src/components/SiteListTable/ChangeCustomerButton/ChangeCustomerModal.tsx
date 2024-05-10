import { useState } from 'react'
import {
  Modal,
  ModalProps,
  Form,
  Alert,
  Input,
  Select,
  FormInstance,
} from 'antd'
import { chosenRecordAtom } from '@/components/SiteListTable/atom'
import { useAtomValue } from 'jotai'
import { useQuery } from '@tanstack/react-query'
import { axios } from '@/api'
import { kebab } from '@/utils'
import { AxiosResponse } from 'axios'

type TChangeCustomerParams = {
  modalProps: ModalProps
  form: FormInstance
}

type TCustomer = {
  id: string
  display_name: string
}

type TGetCustomersResponse = AxiosResponse<{
  status: number
  data: TCustomer[]
}>

export const ChangeCustomerModal = ({
  modalProps,
  form,
}: TChangeCustomerParams) => {
  const [search, setSearch] = useState<string>('')
  const chosenRecord = useAtomValue(chosenRecordAtom)
  const customerId = chosenRecord?.customer_id

  const { data, isPending } = useQuery<TGetCustomersResponse>({
    queryKey: ['get_customers_by_id', customerId],
    queryFn: () =>
      axios.get(`/${kebab}/customers`, {
        params: {
          id: customerId,
        },
      }),
    enabled: !!customerId,
  })

  const customers = data?.data?.data || []
  const customerName =
    customers.find((customer) => customer.id === customerId)?.display_name ||
    '未知客戶'

  // 下拉選單搜索

  const handleChange = (newValue: string) => {
    console.log('⭐  newValue:', newValue)

    // setValue(newValue)
  }

  const handleSearch = (newSearch: string) => {
    setSearch(newSearch)
  }

  const { data: searchedData, isPending: searchedIsLoading } =
    useQuery<TGetCustomersResponse>({
      queryKey: ['get_customers_by_search', search],
      queryFn: () =>
        axios.get(`/${kebab}/customers`, {
          params: {
            search,
          },
        }),
      enabled: search?.length > 1,
    })

  const searchedCustomers = searchedData?.data?.data || []

  return (
    <Modal {...modalProps}>
      <Form form={form} layout="vertical" className="mt-8">
        <Alert
          message="提醒："
          description="變更客戶後，此網站將不再顯示在舊用戶前台的站台列表裡面"
          type="info"
          showIcon
        />
        <div className="mb-6 mt-8">
          <p className="text-[0.875rem] mt-0 mb-2">當前客戶</p>
          <p className="m-0 rounded-md bg-gray-100 border-solid border-[1px] border-gray-300 py-1 px-3">
            {isPending ? (
              <div className="animate-pulse bg-slate-400 h-4 w-20 rounded" />
            ) : (
              `${customerName} - #${customerId}`
            )}
          </p>
        </div>
        <Form.Item
          label="新客戶 - 請輸入至少 2 個字元以搜尋客戶"
          name={['new_customer_id']}
          rules={[
            { required: true, message: '請輸入至少 2 個字元以搜尋客戶' },
          ]}
        >
          <Select
            showSearch
            allowClear
            loading={searchedIsLoading}
            placeholder="請輸入至少 2 個字元以搜尋客戶"
            defaultActiveFirstOption={false}
            suffixIcon={null}
            filterOption={false}
            onSearch={handleSearch}
            onChange={handleChange}
            notFoundContent={null}
            options={(searchedCustomers || []).map((c) => ({
              value: c.id,
              label: `${c.display_name} - #${c.id}`,
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
