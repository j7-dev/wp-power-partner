import React from 'react'
import { allowed_template_options, host_positions, kebab } from '@/utils'
import { Select, Form, Button, notification } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { LoadingOutlined } from '@ant-design/icons'
import { identityAtom } from '@/pages/AdminApp/atom'
import { useAtomValue } from 'jotai'

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
  const identity = useAtomValue(identityAtom)

  const queryClient = useQueryClient()

  const { mutate: siteSync, isPending: isPendingSiteSync } = useMutation({
    mutationFn: (params: TManualSiteSyncParams) => {
      return axios.post(`/${kebab}/manual-site-sync`, params)
    },
    onMutate: () => {
      api.open({
        key: 'manual-site-sync',
        message: '正在發送開站請求至站長路可伺服器...',
        description:
          '正在發送請求中...有可能需要等待 🕙 30 秒 ~ 1 分鐘左右的時間，請先不要關閉視窗🙏',
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
      const email = identity?.data?.email || ''

      if (200 === status) {
        api.success({
          key: 'manual-site-sync',
          message: '已經收到您的開站請求',
          description: (
            <>
              站長路可伺服器正在處理您的請求，大約等待 🕙 5 ~ 10
              分鐘左右，開站完成後會將相關資訊寄送到您信箱 {email}`
            </>
          ),
          duration: 0,
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
    siteSync(values)
  }

  // clear cache

  const { mutate: mutateClearCache, isPending: isPendingClearCache } =
    useMutation({
      mutationFn: () => {
        return axios.post(`/${kebab}/clear-template-sites-cache`)
      },
      onMutate: () => {
        api.open({
          key: 'clear-template-sites-cache',
          message: '正在清除模板站快取...',
          duration: 0,
          icon: <LoadingOutlined className="text-primary" />,
        })
      },
      onError: (err) => {
        console.log('err', err)
        api.error({
          key: 'clear-template-sites-cache',
          message: 'OOPS! 清除模板站快取時發生問題',
        })
      },
      onSuccess: (data) => {
        const status = data?.data?.status
        const message = data?.data?.message

        if (200 === status) {
          api.success({
            key: 'clear-template-sites-cache',
            message: '已經清除模板站快取',
            duration: 0,
          })
          queryClient.invalidateQueries({ queryKey: ['apps'] })
        } else {
          api.error({
            key: 'clear-template-sites-cache',
            message: 'OOPS! 清除模板站快取時發生問題',
            description: message,
          })
        }
      },
    })

  const handleClearCache = () => {
    mutateClearCache()
  }

  const isPending = isPendingSiteSync || isPendingClearCache

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
          disabled={isPending}
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
        <Select options={host_positions} allowClear disabled={isPending} />
      </Item>

      <Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit" loading={isPending}>
          開站
        </Button>

        <Button
          type="default"
          htmlType="button"
          className="ml-2"
          onClick={handleClearCache}
        >
          清除快取
        </Button>
      </Item>
    </Form>
  )
}

export default index
