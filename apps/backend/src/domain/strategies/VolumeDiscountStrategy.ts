import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export class VolumeDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.VOLUME;

  constructor(private readonly rate: number, private readonly threshold: number) {}

  apply(context: DiscountContext): DiscountResult {
    if (context.runningSubtotal <= this.threshold) {
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