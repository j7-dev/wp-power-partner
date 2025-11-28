import { useMutation } from '@tanstack/react-query'

import { Button, Form, Input, Alert, notification } from 'antd'
import { powerCloudAxios } from '@/api'
import { EPowercloudIdentityStatusEnum, powercloudIdentityAtom } from '@/pages/AdminApp/Atom/powercloud.atom'
import { globalLoadingAtom } from '@/pages/AdminApp/Atom/atom'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { TAccountInfo } from '@/pages/AdminApp/types'
import { renderHTML } from '@/utils'

const Login = () => {
	const [form] = Form.useForm()
	const setIdentity = useSetAtom(powercloudIdentityAtom)
	const setGlobalLoading = useSetAtom(globalLoadingAtom)
	// powercloud login
	const { mutate: powercloudLogin, isPending: isPendingPowercloudLogin } =
		useMutation({
			mutationFn: (values: { email: string; password: string }) =>
				powerCloudAxios.post('/auth/api-key', values),
			onMutate: (values: { email: string; password: string }) => {
				setGlobalLoading({
					isLoading: true,
					label: '正在獲取 Powercloud API Key...',
				})
			},
			onSettled: () => {
				setGlobalLoading({
					isLoading: false,
					label: '',
				})
			},
		})

	const onFinish = () => {
		const values: TAccountInfo = form.getFieldsValue()
		powercloudLogin(values, {
			onSuccess: (res) => {
				setIdentity({
					status: EPowercloudIdentityStatusEnum.LOGGED_IN,
					message: '',
					apiKey: res?.data?.apiKey,
				})
			},
            onError: (err) => {
                notification.error({
                    message: err?.message || '登入失敗',
                    description: renderHTML(JSON.stringify(err || '')),
                })
            },
        })
    }

    const isPending = isPendingPowercloudLogin
    return (
        <div className="w-full max-w-[20rem] relative m-auto mt-12">
            <Alert
                message="請輸入你在 Powercloud 的帳號密碼"
                type="info"
                showIcon
                className="mb-8"
            />
            <Form form={form} autoComplete="off" layout="vertical">
				<Form.Item<TAccountInfo>
					label="E-mail"
					name="email"
					rules={[
						{ required: true, message: '請輸入 Email' },
						{ type: 'email', message: '請輸入有效的 Email' },
					]}
				>
					<Input size="large" disabled={isPending} />
				</Form.Item>

				<Form.Item<TAccountInfo>
					label="Password"
					name="password"
					rules={[{ required: true, message: '請輸入密碼' }]}
				>
					<Input.Password size="large" disabled={isPending} />
				</Form.Item>

				<Form.Item>
					<Button
						type="primary"
						onClick={onFinish}
						className="w-full"
						size="large"
						loading={isPending}
					>
						連結帳號
					</Button>
				</Form.Item>
			</Form>
		</div>
	)
}

const Logout = () => {
	const [_, setPowercloudIdentity] = useAtom(powercloudIdentityAtom)

	const handleLogout = () => {
		setPowercloudIdentity({
			status: EPowercloudIdentityStatusEnum.UN_LOGIN,
			message: '',
			apiKey: '',
		})
	}
	return <div>
		<Button variant='outlined' danger onClick={handleLogout}>
			登出
		</Button>
	</div>
}

const index = () => {
	const powercloudIdentity = useAtomValue(powercloudIdentityAtom)
	if(powercloudIdentity.status === EPowercloudIdentityStatusEnum.UN_LOGIN) return <Login />
	return <Logout />

}

export default index
