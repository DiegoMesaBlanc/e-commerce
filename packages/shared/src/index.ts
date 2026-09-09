export enum Category {
  TECHNOLOGY = 'TECHNOLOGY',
  OTHER = 'OTHER',
}

export interface Product {
  readonly id: string;
  name: string;
  price: number;
  category: Category;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface DiscountBreakdown {
  categoryDiscount: number;
  volumeDiscount: number;
  couponDiscount: number;
  effectivePercentage: number;
  totalSavings: number;
  limitReached: boolean;
}

export interface CheckoutRequestDTO {
  cartItems: ReadonlyArray<{ readonly productId: string; readonly quantity: number }>;
  couponCode?: string;
}

export interface CheckoutResponseDTO {
  orderId: string;
  originalSubtotal: number;
  discountBreakdown: DiscountBreakdown;
  finalTotal: number;
  items: CartItem[];
}

export type CheckoutPreviewResponseDTO = Omit<CheckoutResponseDTO, 'orderId'>;

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
