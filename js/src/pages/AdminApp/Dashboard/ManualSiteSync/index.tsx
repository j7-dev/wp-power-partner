import React from 'react'
import { allowed_template_options, host_positions } from '@/utils'
import { Select, Form, Button, notification } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { LoadingOutlined } from '@ant-design/icons'

const { Item } = Form

type TManualSiteSyncParams = {
  site_id: string
  host_position: string
}

const index = () => {
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
    stack: { threshold: 1 },
    duration: 10,
  })

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (params: TManualSiteSyncParams) => {
      return axios.post('/power-partner/manual-site-sync', params)
    },
    onMutate: () => {
      api.open({
        key: 'manual-site-sync',
        message: '開站中...',
        description:
          '正在開站中...有可能需要等待 2~3 分鐘左右的時間，請先不要關閉視窗。',
        duration: 0,
        icon: <LoadingOutlined className="text-primary" />,
      })
    },
    onError: (err) => {
      console.log('err', err)
      api.error({
        key: 'manual-site-sync',
        message: 'OOPS! 開站時發生問題',
      })
    },
    onSuccess: (data) => {
      const status = data?.data?.status
      const message = data?.data?.message

      if (200 === status) {
        api.success({
          key: 'manual-site-sync',
          message: '開站成功',
          description: message,
        })
        queryClient.invalidateQueries({ queryKey: ['apps'] })
      } else {
        api.error({
          key: 'manual-site-sync',
          message: 'OOPS! 開站時發生問題',
          description: message,
        })
      }
    },
  })

  const handleFinish = (values: TManualSiteSyncParams) => {
    mutate(values)
  }

  return (
    <Form
      className="mt-8"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      onFinish={handleFinish}
    >
      {contextHolder}
      <Item
        label="選擇開站模板"
        name={['site_id']}
        rules={[
          {
            required: true,
            message: '請選擇開站模板',
          },
        ]}
      >
        <Select
          options={Object.keys(allowed_template_options).map((key) => ({
            label: allowed_template_options?.[key],
            value: key,
          }))}
          allowClear
        />
      </Item>
      <Item
        label="選擇主機種類"
        name={['host_position']}
        initialValue="jp"
        rules={[
          {
            required: true,
            message: '請選擇主機種類',
          },
        ]}
      >
        <Select options={host_positions} allowClear />
      </Item>

      <Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={isPending}>
          開站
        </Button>
      </Item>
    </Form>
  )
}

export default index
