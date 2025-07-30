<?php

declare (strict_types = 1);

namespace J7\PowerPartner\Domains\Email\Shared\Enums;

/**
 * Action 是否啟用
 *  */
enum Action: string {
	/** @var string 下單開站後 */
	case SITE_SYNC = 'site_sync';

	/** @var string 續訂失敗後 */
	case SUBSCRIPTION_FAILED = 'subscription_failed';

	/** @var string 續訂成功後 */
	case SUBSCRIPTION_SUCCESS = 'subscription_success';

	/** @var string 上次續訂訂單日期後 */
	case LAST_ORDER_DATE_CREATED = 'last_order_date_created';

	/** @var string 訂閱成立後 */
	case DATE_CREATED = 'date_created';

	/** @var string 試用結束前|後 */
	case TRIAL_END = 'trial_end';

	/** @var string 下次付款前|後 */
	case NEXT_PAYMENT = 'next_payment';

	/** @var string 訂閱結束 */
	case END = 'end';

	/** @var string 訂閱結束 */
	case END_OF_PREPAID_TERM = 'end_of_prepaid_term';
}
