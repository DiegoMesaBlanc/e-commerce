import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export class CouponDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.COUPON;

  constructor(private readonly rate: number, private readonly couponCode: string) {}

  apply(context: DiscountContext): DiscountResult {
    if (context.couponCode !== this.couponCode) {
      return { discountAmount: 0, applied: false, limitReached: false };
    }

    const discountAmount = roundMoney(context.runningSubtotal * this.rate);

    return {
      discountAmount,
      applied: true,
      limitReached: false,
    };
  }
}