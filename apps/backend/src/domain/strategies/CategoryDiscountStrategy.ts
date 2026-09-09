import { Category, type CartItem } from '@examen-ecommerce/shared';
import { roundMoney } from '../utils/money';
import {
  type DiscountContext,
  type DiscountResult,
  type IDiscountStrategy,
  DiscountStrategyName,
} from './IDiscountStrategy';

export class CategoryDiscountStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.CATEGORY;

  constructor(private readonly rate: number) {}

  apply(context: DiscountContext): DiscountResult {
    const technologySubtotal = context.cartItems
      .filter((item: CartItem) => item.product.category === Category.TECHNOLOGY)
      .reduce((sum: number, item: CartItem) => sum + item.product.price * item.quantity, 0);

    const discountAmount = roundMoney(technologySubtotal * this.rate);

    return {
      discountAmount,
      applied: discountAmount > 0,
      limitReached: false,
    };
  }
}