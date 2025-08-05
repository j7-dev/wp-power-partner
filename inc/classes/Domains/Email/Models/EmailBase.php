<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Models;

use J7\PowerPartner\Domains\Email\Shared\Enums;
use J7\PowerPartner\Domains\Email\DTOs\Email as EmailDTO;

/**
 * Email Base Model
 *  */
class EmailBase {

	/** Constructor */
	public function __construct(
		private EmailDTO $dto
	) {
	}

	/**
	 * 取得發信時間的 timestamp 偏移量
	 *
	 * @return int timestamp 多久後，或多久前寄信的偏移量
	 */
	public function get_timestamp_shift(): int {
		$dto      = $this->dto;
		$operator = Enums\Operator::from( $dto->operator );
		return ( (int) $dto->days ) * 86400 * $operator->symbol();
	}
}
