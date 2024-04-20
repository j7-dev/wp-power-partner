import React, { useEffect } from 'react'
import { DataType } from '@/pages/AdminApp/Dashboard/EmailSetting/types'
import { FormInstance, notification } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { axios } from '@/api'
import { LoadingOutlined } from '@ant-design/icons'

const useSave = (form: FormInstance<DataType[]>) => {
  const queryClient = useQueryClient()
  const [api, contextHolder] = notification.useNotification({
    placement: 'bottomRight',
    stack: { threshold: 1 },
    duration: 10,
  })

  const { mutate: saveEmails } = useMutation({
    mutationFn: (values: { emails: DataType[] }) =>
      axios.post('/power-partner/emails', values),
    onMutate: () => {
      api.open({
        key: 'save-emails',
        message: '儲存 Email 中...',
        duration: 0,
        icon: <LoadingOutlined className="text-primary" />,
      })
    },
    onError: (err) => {
      console.log('err', err)
      api.error({
        key: 'save-emails',
        message: 'OOPS! 儲存 Email 時發生問題',
      })
    },
    onSuccess: (data) => {
      const status = data?.data?.status
      const message = data?.data?.message

      if (200 === status) {
        api.success({
          key: 'save-emails',
          message: '儲存 Email 成功',
        })
        queryClient.invalidateQueries(['emails'])
      } else {
        api.error({
          key: 'save-emails',
          message: 'OOPS! 儲存 Email 時發生問題',
          description: message,
        })
      }
    },
  })

  const handleSave = () => {
    const values = form.getFieldsValue()
    saveEmails({
      emails: values,
    })
  }

  useEffect(() => {
    const saveBtnNode = document.getElementById('redux_bottom_save')
    if (saveBtnNode) {
      saveBtnNode.addEventListener('click', handleSave)

      return () => {
        saveBtnNode.removeEventListener('click', handleSave)
      }
    }
  }, [])

  return {
    contextHolder,
  }
}

export default useSave
