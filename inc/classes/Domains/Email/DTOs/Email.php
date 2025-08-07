<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Email\DTOs;

use J7\WpUtils\Classes\DTO;
use J7\PowerPartner\Domains\Email\Shared\Enums;
use J7\Powerhouse\Domains\Subscription\Shared\Enums\Action;

/**
 * Class Email
 * 都用 string 是因為都是存在 option table 裡面，不需要多餘轉換
 *  */
final class Email extends DTO {
	/** @var string 信件 key 給前端 render 使用 */
	public string $key;

	/** @var Enums\Enabled::value 是否啟用 */
	public string $enabled;

	/** @var string 信件主旨 */
	public string $subject;

	/** @var string 信件內容 */
	public string $body;

	/** @var Enums\Action::value|'site_sync' 信件動作名稱  */
	public string $action_name;

	/** @var numeric-string 信件天數 */
	public string $days;

	/** @var Enums\Operator::value 信件運算子 'after' | 'before' */
	public string $operator;

	/**
	 * @return void Validate
	 * @throws \Exception 如果驗證失敗
	 *  */
	protected function validate(): void {
		Enums\Operator::from( $this->operator );

		if ( !Action::tryFrom( $this->action_name ) && 'site_sync' !== $this->action_name ) {
			throw new \Exception('Invalid action_name, got: ' . $this->action_name);
		}

		if ( !Enums\Enabled::tryFrom( $this->enabled ) ) {
			$this->enabled = \wc_string_to_bool( $this->enabled ) ? Enums\Enabled::ENABLED->value : Enums\Enabled::DISABLED->value;
		}

		if ( !is_numeric( $this->days ) ) {
			throw new \Exception('Invalid days, only accept numeric, got: ' . $this->days);
		}
	}
}
