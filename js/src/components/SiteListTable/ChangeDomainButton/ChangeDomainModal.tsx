import {
  Modal,
  ModalProps,
  Form,
  Alert,
  Tag,
  Input,
  Typography,
  FormInstance,
} from 'antd'
import { chosenRecordAtom } from '@/components/SiteListTable/atom'
import { useAtomValue } from 'jotai'

const { Paragraph } = Typography

type TChangeDomainParams = {
  modalProps: ModalProps
  form: FormInstance
}

export const ChangeDomainModal = ({
  modalProps,
  form,
}: TChangeDomainParams) => {
  const chosenRecord = useAtomValue(chosenRecordAtom)

  return (
    <Modal {...modalProps}>
      <Form form={form} layout="vertical" className="mt-8">
        <Alert
          message="提醒："
          description="請先將網域DNS設定中的A紀錄(A Record) 指向 [ip]，再變更網域"
          type="info"
          showIcon
        />
        <div className="mb-6 mt-8">
          <p className="text-[0.875rem] mt-0 mb-2">當前域名</p>
          <Paragraph
            className="m-0 rounded-md bg-gray-100 border-solid border-[1px] border-gray-300 py-1 px-3"
            copyable
          >
            {chosenRecord?.wpapp_domain}
          </Paragraph>
        </div>
        <Form.Item
          label="新域名"
          name={['new_domain']}
          rules={[
            { required: true, message: '請輸入新的 domain name' },
            {
              // 匹配 1~4個 . 且不含http(s)://的網址

              pattern:
                /^(?!http(s)?:\/\/)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/g,
              message: (
                <>
                  請輸入不含 <Tag>http(s)://</Tag> 的合格的網址
                </>
              ),
            },
          ]}
        >
          <Input placeholder="請輸入新的 domain name" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
