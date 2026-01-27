import { atomWithStorage } from 'jotai/utils'

export enum EPowercloudIdentityStatusEnum {
  UN_LOGIN = 'unLogin',
  LOGGED_IN = 'loggedIn',
}

export type TPowercloudIdentity = {
	status: EPowercloudIdentityStatusEnum
	message: string
  apiKey: string
}

export const defaultPowercloudIdentity: TPowercloudIdentity = {
  status: EPowercloudIdentityStatusEnum.UN_LOGIN,
  message: '',
  apiKey: '',
}

const POWERCLOUD_IDENTITY_STORAGE_KEY = 'power-partner-powercloud-identity'

export const powercloudIdentityAtom = atomWithStorage<TPowercloudIdentity>(
	POWERCLOUD_IDENTITY_STORAGE_KEY,
	defaultPowercloudIdentity
)

