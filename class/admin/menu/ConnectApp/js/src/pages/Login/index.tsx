import { Button, Form, Input, notification, Alert } from 'antd'
import { cloudAxios } from '@/api'
import { identityAtom, globalLoadingAtom } from '@/pages/atom'
import { useSetAtom } from 'jotai'
import { renderHTML, encrypt, LOCALSTORAGE_ACCOUNT_KEY } from '@/utils'
import { TAccountInfo } from '@/pages/types'
import { useMutation } from '@tanstack/react-query'

const index = () => {
  const setIdentity = useSetAtom(identityAtom)
  const setGlobalLoading = useSetAtom(globalLoadingAtom)
  const { mutate, isLoading } = useMutation({
    mutationFn: (values: TAccountInfo) => {
      setGlobalLoading({
        isLoading: true,
        label: '正在獲取用戶資料...',
      })

      return cloudAxios.post('/identity', values)
    },
    onError: (err) => {
      console.log('err', err)
    },
    onSettled: () => {
      setGlobalLoading({
        isLoading: false,
        label: '',
      })
    },
  })

  const onFinish = (values: TAccountInfo) => {
    mutate(values, {
      onSuccess: (res) => {
        const theIdentity = res?.data
        setIdentity(theIdentity)
        if (theIdentity?.status === 200) {
          localStorage.setItem(LOCALSTORAGE_ACCOUNT_KEY, encrypt(values))
        } else {
          notification.error({
            message: theIdentity?.message,
            description: renderHTML(theIdentity?.data || ''),
          })
        }
      },
    })
  }

  return (
    <div className="w-full max-w-[20rem] relative m-auto mt-12">
      <Alert
        message="請輸入你在 cloud.luke.cafe 的帳號密碼"
        type="info"
        showIcon
        className="mb-8"
      />
      <Form onFinish={onFinish} autoComplete="off" layout="vertical">
        <Form.Item<TAccountInfo>
          label="E-mail"
          name="email"
          rules={[
            { required: true, message: '請輸入 Email' },
            { type: 'email', message: '請輸入有效的 Email' },
          ]}
        >
          <Input size="large" disabled={isLoading} />
        </Form.Item>

        <Form.Item<TAccountInfo>
          label="Password"
          name="password"
          rules={[{ required: true, message: '請輸入密碼' }]}
        >
          <Input.Password size="large" disabled={isLoading} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
            size="large"
            loading={isLoading}
          >
            連結帳號
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default index
