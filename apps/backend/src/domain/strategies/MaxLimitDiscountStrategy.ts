import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export const MAX_DISCOUNT_RATE = 0.35;

export class MaxLimitDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.MAX_LIMIT;

  apply(context: DiscountContext): DiscountResult {
    const maxAllowedDiscount = roundMoney(context.originalSubtotal * MAX_DISCOUNT_RATE);
    const cumulativeSavings = roundMoney(context.originalSubtotal - context.runningSubtotal);

    if (cumulativeSavings <= maxAllowedDiscount) {
      return { discountAmount: 0, applied: false, limitReached: false };
    }

    const excess = roundMoney(cumulativeSavings - maxAllowedDiscount);

    return {
      discountAmount: -excess,
      applied: true,
      limitReached: true,
    };
  }
}