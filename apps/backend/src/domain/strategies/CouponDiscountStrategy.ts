import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
  WELCOME2026_COUPON,
} from './IDiscountStrategy';

export const COUPON_DISCOUNT_RATE = 0.15;

export class CouponDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.COUPON;

  apply(context: DiscountContext): DiscountResult {
    if (context.couponCode !== WELCOME2026_COUPON) {
      return { discountAmount: 0, applied: false, limitReached: false };
    }

    const discountAmount = roundMoney(context.runningSubtotal * COUPON_DISCOUNT_RATE);

    return {
      discountAmount,
      applied: true,
      limitReached: false,
    };
  }
}