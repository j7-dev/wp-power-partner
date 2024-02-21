import { Button, Form, Input, notification } from 'antd'
import { cloudAxios } from '@/api'
import { identityAtom } from '@/pages/atom'
import { useSetAtom } from 'jotai'
import { useUpdate } from '@/hooks'
import { currentUserId, snake, renderHTML } from '@/utils'
import { TAccountInfo } from '@/pages/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const index = () => {
  const queryClient = useQueryClient()
  const setIdentity = useSetAtom(identityAtom)
  const { mutate: updateUser, isLoading: updateUserIsLoading } = useUpdate({
    resource: `users/${currentUserId}`,
    mutationOptions: {
      onSuccess: () => {
        queryClient.invalidateQueries(['get-user-identity'])
      },
    },
  })
  const { mutate, isLoading } = useMutation({
    mutationFn: (values: TAccountInfo) => {
      return cloudAxios.post('/identity', values)
    },
    onError: (err) => {
      console.log('err', err)
    },
  })

  const onFinish = (values: TAccountInfo) => {
    mutate(values, {
      onSuccess: (res) => {
        const theIdentity = res?.data
        setIdentity(theIdentity)
        if (theIdentity?.status === 200) {
          // 發 API 將 payload 存入 usermeta

          updateUser({
            meta: {
              [`${snake}_identity`]: JSON.stringify(values),
            },
          })
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
    <div className="w-full max-w-[20rem]">
      <Form onFinish={onFinish} autoComplete="off" layout="vertical">
        <Form.Item<TAccountInfo>
          label="E-mail"
          name="email"
          rules={[
            { required: true, message: '請輸入 Email' },
            { type: 'email', message: '請輸入有效的 Email' },
          ]}
        >
          <Input size="large" disabled={isLoading || updateUserIsLoading} />
        </Form.Item>

        <Form.Item<TAccountInfo>
          label="Password"
          name="password"
          rules={[{ required: true, message: '請輸入密碼' }]}
        >
          <Input.Password
            size="large"
            disabled={isLoading || updateUserIsLoading}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="w-full"
            size="large"
            loading={isLoading || updateUserIsLoading}
          >
            連結帳號
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default index
