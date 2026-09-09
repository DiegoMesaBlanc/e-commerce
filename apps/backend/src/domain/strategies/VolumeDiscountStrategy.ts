import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export const VOLUME_DISCOUNT_RATE = 0.05;
export const VOLUME_DISCOUNT_THRESHOLD = 100;

export class VolumeDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.VOLUME;

  apply(context: DiscountContext): DiscountResult {
    if (context.runningSubtotal <= VOLUME_DISCOUNT_THRESHOLD) {
      return { discountAmount: 0, applied: false, limitReached: false };
    }

    const discountAmount = roundMoney(context.runningSubtotal * VOLUME_DISCOUNT_RATE);

    return {
      discountAmount,
      applied: true,
      limitReached: false,
    };
  }
}