import type { CartItem, DiscountBreakdown, OrderStatus } from '@examen-ecommerce/shared';

export interface Order {
  orderId: string;
  couponCode: string | undefined;
  items: CartItem[];
  originalSubtotal: number;
  discountBreakdown: DiscountBreakdown;
  finalTotal: number;
  status: OrderStatus;
  createdAt: Date;
}