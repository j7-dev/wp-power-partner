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

type TChangeCustomerParams = {
  modalProps: ModalProps
  form: FormInstance
}

export const ChangeCustomerModal = ({
  modalProps,
  form,
}: TChangeCustomerParams) => {
  const chosenRecord = useAtomValue(chosenRecordAtom)

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
            {/* {chosenRecord?.wpapp_domain} */}
            j7.dev.gg
          </p>
        </div>
        <Form.Item
          label="新客戶"
          name={['customer_id']}
          rules={[
            { required: true, message: '請輸入新的客戶ID' },
          ]}
        >
          <Input placeholder="請輸入新的客戶ID" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
