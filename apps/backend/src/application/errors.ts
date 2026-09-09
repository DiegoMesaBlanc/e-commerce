export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export class EmptyCartError extends AppError {
  constructor() {
    super('The cart is empty.', 400);
  }
}

export class InvalidCartItemError extends AppError {
  constructor(productId: string) {
    super(`Invalid quantity for product "${productId}".`, 400);
  }
}

export class InvalidCouponError extends AppError {
  constructor(couponCode: string) {
    super(`Invalid coupon code "${couponCode}".`, 400);
  }
}

export class ProductNotFoundError extends AppError {
  constructor(productId: string) {
    super(`Product "${productId}" was not found.`, 404);
  }
}

export class InsufficientStockError extends AppError {
  constructor(productName: string, availableStock: number, requestedQuantity: number) {
    super(
      `Insufficient stock for product "${productName}": requested ${requestedQuantity}, available ${availableStock}.`,
      400,
    );
  }
}