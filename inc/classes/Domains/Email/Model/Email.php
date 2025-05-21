<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\Model;

use J7\WpUtils\Classes\DTO;
use J7\PowerPartner\Domains\Email\Core\Service;

/**
 * Class Email
 * 都用 string 是因為都是存在 option table 裡面，不需要多餘轉換
 *  */
final class Email extends DTO {
	/** @var string 信件 key 給前端 render 使用 */
	public string $key;

	/** @var string 是否啟用 '1' | '0' */
	public string $enabled;

	/** @var string 信件主旨 */
	public string $subject;

	/** @var string 信件內容 */
	public string $body;

	/** @var string 信件動作名稱  */
	public string $action_name;

	/** @var numeric-string 信件天數 */
	public string $days;

	/** @var string 信件運算子 'after' | 'before' */
	public string $operator;

	/** @return void Validate */
	protected function validate(): void {
		if ( !in_array( $this->enabled, [ '1', '0' ], true ) ) {
			$this->enabled = \wc_string_to_bool( $this->enabled ) ? '1' : '0';
		}

		if ( !in_array( $this->operator, [ 'after', 'before' ], true ) ) {
			$this->dto_error->add( 'invalid_operator', 'Invalid operator，只接受 after 或 before' );
		}

		if ( !is_numeric( $this->days ) ) {
			$this->dto_error->add( 'invalid_days', 'Invalid days，只接受數字' );
		}

		if ( !in_array( $this->action_name, Service::get_action_names(), true ) ) {
			$this->dto_error->add( 'invalid_action_name', 'Invalid action_name，只接受 ' . implode( ', ', Service::get_action_names() ) );
		}
	}

	/** @return int timestamp 多久後，或多久前寄信 */
	public function get_timestamp(): int {
		return ( (int) $this->days ) * 86400 * ( $this->operator === 'before' ? -1 : 1 );
	}
}
