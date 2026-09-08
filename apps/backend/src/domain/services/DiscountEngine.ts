import type { CartItem, DiscountBreakdown } from '@examen-ecommerce/shared';
import { roundMoney, percentageFromRatio } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from '../strategies/IDiscountStrategy';

export interface DiscountEngineResult {
  readonly originalSubtotal: number;
  readonly discountBreakdown: DiscountBreakdown;
  readonly finalTotal: number;
}

export class DiscountEngine {
  private readonly strategies: ReadonlyMap<DiscountStrategyName, IDiscountStrategy>;

  constructor(strategies: IDiscountStrategy[]) {
    this.strategies = new Map(strategies.map((strategy) => [strategy.name, strategy]));
  }

  execute(cartItems: CartItem[], couponCode?: string): DiscountEngineResult {
    const originalSubtotal = this.computeSubtotal(cartItems);

    const category = this.run(
      DiscountStrategyName.CATEGORY,
      cartItems,
      couponCode,
      originalSubtotal,
      originalSubtotal,
    );
    const afterCategory = roundMoney(originalSubtotal - category.discountAmount);

    const volume = this.run(
      DiscountStrategyName.VOLUME,
      cartItems,
      couponCode,
      originalSubtotal,
      afterCategory,
    );
    const afterVolume = roundMoney(afterCategory - volume.discountAmount);

    const coupon = this.run(
      DiscountStrategyName.COUPON,
      cartItems,
      couponCode,
      originalSubtotal,
      afterVolume,
    );
    const afterCoupon = roundMoney(afterVolume - coupon.discountAmount);

    const maxLimit = this.run(
      DiscountStrategyName.MAX_LIMIT,
      cartItems,
      couponCode,
      originalSubtotal,
      afterCoupon,
    );
    const finalTotal = roundMoney(afterCoupon - maxLimit.discountAmount);
    const totalSavings = roundMoney(originalSubtotal - finalTotal);

    const discountBreakdown: DiscountBreakdown = {
      categoryDiscount: category.discountAmount,
      volumeDiscount: volume.discountAmount,
      couponDiscount: coupon.discountAmount,
      effectivePercentage:
        originalSubtotal === 0 ? 0 : percentageFromRatio(totalSavings / originalSubtotal),
      totalSavings,
      limitReached: maxLimit.limitReached,
    };

    return {
      originalSubtotal,
      discountBreakdown,
      finalTotal,
    };
  }

  private run(
    name: DiscountStrategyName,
    cartItems: CartItem[],
    couponCode: string | undefined,
    originalSubtotal: number,
    runningSubtotal: number,
  ): DiscountResult {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Missing discount strategy: ${name}`);
    }

    const context: DiscountContext = {
      cartItems,
      couponCode,
      originalSubtotal,
      runningSubtotal,
    };

    return strategy.apply(context);
  }

  private computeSubtotal(cartItems: CartItem[]): number {
    return roundMoney(
      cartItems.reduce((sum: number, item: CartItem) => sum + item.product.price * item.quantity, 0),
    );
  }
}