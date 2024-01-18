<?php

declare(strict_types=1);

namespace J7\PowerPartner;

class Utils
{
	const APP_NAME       = 'Power Partner';
	const KEBAB          = 'power-partner';
	const SNAKE          = 'power_partner';
	const GITHUB_REPO         = 'https://github.com/j7-dev/wp-power-partner';
	const GITHUB_PAT = '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';
	const ORDER_META_KEY = 'pp_create_site_responses';

	const IS_LOCAL = true;

	protected const API_URL   = self::IS_LOCAL ? 'http://luke.local' : 'https://cloud.luke.cafe';
	protected const USER_NAME = 'j7.dev.gg';
	protected const PASSWORD  = self::IS_LOCAL ? 'Hzn3 l5V8 FeRF qcBX EAmX A6w0' : 'YQLj xV2R js9p IWYB VWxp oL2E';

	protected const TEMPLATE_SERVER_ID = 2202;
	protected const TRANSIENT_KEY      = 'pp_cloud_sites';
}
