import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export class MaxLimitDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.MAX_LIMIT;

  constructor(private readonly maxRate: number) {}

  apply(context: DiscountContext): DiscountResult {
    const maxAllowedDiscount = roundMoney(context.originalSubtotal * this.maxRate);
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