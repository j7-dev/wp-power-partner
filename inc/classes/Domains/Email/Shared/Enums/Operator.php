<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Domains\Email\Shared\Enums;

/**
 * Operator 是否啟用
 *  */
enum Operator: string {
	/** @var string 指定日期後 */
	case AFTER = 'after';

	/** @var string 指定日期前 */
	case BEFORE = 'before';

	/** 取得運算符號， 1 或 -1 */
	public function symbol(): int {
		return match ( $this ) {
			self::AFTER => 1,
			self::BEFORE => -1,
		};
	}
}
