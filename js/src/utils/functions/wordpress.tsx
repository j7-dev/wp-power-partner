/**
 * 使用前綴生成 wpsite.pro 的 namespace 和 domain
 * @param prefix 前綴字符串
 * @returns 包含 namespace 和 domain 的對象
 */
export function generateWpsiteProConfig(prefix: string) {
    const randomNumber = Math.floor(Math.random() * 10000)
	return {
		namespace: `${prefix}-${randomNumber}-wpsite-pro`,
		domain: `${prefix}-${randomNumber}.wpsite.pro`,
		name: `${prefix}-${randomNumber}-wpsite-pro`,
	}
}

const randomAdj = [
	'bright',
	'curious',
	'dynamic',
	'eager',
	'fabulous',
	'fantastic',
	'friendly',
	'gorgeous',
	'happy',
	'incredible',
	'intelligent',
	'jolly',
	'kind',
	'lively',
	'magnificent',
	'mysterious',
	'neat',
	'optimistic',
	'perfect',
	'quaint',
	'remarkable',
	'smart',
	'splendid',
]

const randomAnimal = [
	'lion',
	'tiger',
	'bear',
	'elephant',
	'giraffe',
	'zebra',
	'kangaroo',
	'panda',
	'monkey',
	'dog',
	'cat',
	'rabbit',
	'horse',
	'sheep',
	'cow',
	'chicken',
	'duck',
	'goat',
	'wolf',
	'fox',
	'otter',
	'salmon',
	'whale',
	'shark',
	'turtle',
	'dolphin',
	'penguin',
]

/**
 * 生成隨機前綴（形容詞 + 動物）
 * @returns 隨機生成的前綴字符串，例如: "happy-panda"
 */
export function generateRandomPrefix(): string {
	const adj = randomAdj[Math.floor(Math.random() * randomAdj.length)]
	const animal = randomAnimal[Math.floor(Math.random() * randomAnimal.length)]
	return `${adj}-${animal}`
}

/**
 * 生成隨機的 wpsite.pro 配置
 * @returns 包含 namespace、domain 和 name 的配置對象
 */
export function generateRandomWpsiteProConfig() {
	const prefix = generateRandomPrefix()
	return generateWpsiteProConfig(prefix)
}