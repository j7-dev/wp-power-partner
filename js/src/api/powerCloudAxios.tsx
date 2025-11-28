/* eslint-disable quote-props */
import axios, { AxiosInstance } from 'axios'
import { POWERCLOUD_API, apiTimeout } from '@/utils'
import { notification } from 'antd'

const instance: AxiosInstance = axios.create({
	baseURL: POWERCLOUD_API,
	timeout: parseInt(apiTimeout, 10),
	headers: {
		'Content-Type': 'application/json',
	},
})

instance.interceptors.response.use(
	function (response) {
		// Any status code that lie within the range of 2xx cause this function to trigger

		// const type = response?.data?.type
		// const method = response?.config?.method || ''
		// const statusText = response?.statusText
		// const typeText = getTypeText(type, method, statusText)
		// if (method !== 'get') {
		//   console.log(`${typeText} success`)
		// }

		return response
	},
	async function (error) {
		const message =
			error?.response?.data?.message || 'OOPS! 發生錯誤 請稍後再試'

		notification.error({
			message: message,
		})

		return Promise.reject(error)
	},
)

export default instance
