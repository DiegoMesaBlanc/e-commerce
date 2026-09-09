import type { CartItem } from '@examen-ecommerce/shared';

export enum DiscountStrategyName {
  CATEGORY = 'CATEGORY',
  VOLUME = 'VOLUME',
  COUPON = 'COUPON',
  MAX_LIMIT = 'MAX_LIMIT',
}

export interface DiscountContext {
  readonly cartItems: CartItem[];
  readonly couponCode: string | undefined;
  readonly originalSubtotal: number;
  readonly runningSubtotal: number;
}

export interface DiscountResult {
  readonly discountAmount: number;
  readonly applied: boolean;
  readonly limitReached: boolean;
}

export interface IDiscountStrategy {
  readonly name: DiscountStrategyName;
  apply(context: DiscountContext): DiscountResult;
}