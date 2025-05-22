<?php

declare(strict_types=1);

namespace J7\PowerPartner\Domains\Subscription\Model;

use J7\WpUtils\Classes\DTO;

/**
	 * Class Times
	 * 訂閱的各時間點
 *  */
final class Times extends DTO {


	/** @var int $trial_end 試用期結束時間戳記 */
	public int $trial_end;

	/** @var int $next_payment 下次付款時間戳記 */
	public int $next_payment;

	/** @var int $last_order_date_created 最後訂單創建時間戳記 */
	public int $last_order_date_created;

	/** @var int $end 訂閱結束時間戳記 */
	public int $end;

	/** @var int $end_of_prepaid_term 預付期間結束時間戳記 */
	public int $end_of_prepaid_term;



	/**
	 * Instance
	 *
	 * @param \WC_Subscription $subscription 訂閱
	 * @return self
	 */
	public static function instance( \WC_Subscription $subscription ): self {

		$args = [
			'trial_end'               => $subscription->get_time( 'trial_end' ),
			'next_payment'            => $subscription->get_time( 'next_payment' ),
			'last_order_date_created' => $subscription->get_time( 'last_order_date_created' ),
			'end'                     => $subscription->get_time( 'end' ),
			'end_of_prepaid_term'     => $subscription->get_time( 'end_of_prepaid_term' ),
		];

		return new self( $args );
	}
}
