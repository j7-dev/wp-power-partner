import React from 'react'
import { Form } from 'antd'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { REDUX } from '@/pages/AdminApp/Dashboard/EmailSetting/utils'
import { EmailComponentProps } from '@/pages/AdminApp/Dashboard/EmailSetting/types'

const modules = {
  // 方式1: 可以是简单的一维数组配置
  // toolbar: ["bold", "italic", "underline", "strike", "blockquote"]
  // 方式2: 可以配置二维数组，进行多个选项的配置

  toolbar: [
    [
      {
        header: [
          false,
          1,
          2,
          3,
          4,
          5,
          6,
        ],
      },
    ],
    [
      'link',
      'bold',
      'italic',
      'underline',
      'strike',
      'blockquote',
    ],
    [{ color: [] }, { background: [] }],
    [
      { list: 'ordered' },
      { list: 'bullet' },
      { indent: '-1' },
      { indent: '+1' },
    ],

    ['clean'],
  ],

  // 方式3: 可以自己指定工具栏的容器
  // toolbar: "#rq-toolbar"
}

const EmailBody = ({ index }: EmailComponentProps) => {
  const form = Form.useFormInstance()

  // const name = `${REDUX.OPT_NAME}[${REDUX.OBJECT_KEY}][${index}][${REDUX.BODY_FIELD_NAME}]`

  const name = [index, REDUX.BODY_FIELD_NAME]
  const watchBody = Form.useWatch(name, form)

  const handleChange = (value: string) => {
    form.setFieldValue(name, value)
  }
  return (
    <div className="pl-12 pb-12">
      <ReactQuill
        modules={modules}
        className="h-[360px] bg-white"
        theme="snow"
        value={watchBody}
        onChange={handleChange}
      />
    </div>
  )
}

export default EmailBody
