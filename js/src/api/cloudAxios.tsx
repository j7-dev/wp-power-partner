/* eslint-disable quote-props */
import axios, { AxiosInstance } from 'axios'
import { apiTimeout, cloudApiUrl, t } from '@/utils'
import { notification } from 'antd'

const instance: AxiosInstance = axios.create({
	baseURL: cloudApiUrl,
	timeout: parseInt(apiTimeout, 10),
	headers: {
		Authorization: `Basic ${t}`,
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
		// Any status codes that falls outside the range of 2xx cause this function to trigger

		notification.error({
			message: 'Error',
			description: error.message,
		})
		console.log('error', error)

		return Promise.reject(error)
	},
)

export default instance
