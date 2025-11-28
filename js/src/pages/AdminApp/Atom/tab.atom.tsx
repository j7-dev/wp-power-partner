import { atom } from 'jotai'

export enum TabKeyEnum {
	SITE_LIST = 'siteList',
	LOG_LIST = 'logList',
	EMAIL = 'email',
	MANUAL_SITE_SYNC = 'manualSiteSync',
	SETTINGS = 'settings',
	LICENSE_CODES = 'licenseCodes',
	DESCRIPTION = 'description',
	POWERCLOUD_AUTH = 'powercloudAuth',
}

export const tabAtom = atom<TabKeyEnum>(TabKeyEnum.SITE_LIST)
export const setTabAtom = atom(null, (_get, set, tab: TabKeyEnum) => {
	set(tabAtom, tab)
})