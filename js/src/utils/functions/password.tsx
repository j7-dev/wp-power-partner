/**
 * 生成隨機密碼（包含大小寫英文字母和數字）
 * @param prefix 前綴
 * @param length 密碼長度（不包含前綴和連字符）
 * @returns 生成的隨機密碼
 */
export function generateRandomPassword(prefix: string = '', length: number = 12): string {
	const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
	const lowercase = 'abcdefghijklmnopqrstuvwxyz'
	const numbers = '0123456789'
	const allChars = uppercase + lowercase + numbers

	let password = ''

	// 確保至少包含一個大寫字母、一個小寫字母和一個數字
	password += uppercase[Math.floor(Math.random() * uppercase.length)]
	password += lowercase[Math.floor(Math.random() * lowercase.length)]
	password += numbers[Math.floor(Math.random() * numbers.length)]

	// 填充剩餘長度
	for (let i = 3; i < length; i++) {
		password += allChars[Math.floor(Math.random() * allChars.length)]
	}

	// 隨機打亂密碼字符順序
	password = password
		.split('')
		.sort(() => Math.random() - 0.5)
		.join('')

	return prefix ? `${prefix}-${password}` : password
}