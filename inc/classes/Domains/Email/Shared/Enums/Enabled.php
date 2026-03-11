<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Domains\Email\Shared\Enums;

/**
 * Email 是否啟用
 *  */
enum Enabled: string {
	/** 啟用 */
	case ENABLED = '1';

	/** 停用 */
	case DISABLED = '0';
}
