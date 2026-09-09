import { randomUUID } from 'node:crypto';
import {
  OrderStatus,
  type CartItem,
  type CheckoutPreviewResponseDTO,
  type CheckoutRequestDTO,
  type CheckoutResponseDTO,
  type Product,
} from '@examen-ecommerce/shared';
import type { DiscountEngine } from '../../domain/services/DiscountEngine';
import { DiscountEngineFactory } from '../../domain/factory/DiscountEngineFactory';
import { config } from '../../config';
import { EmptyCartError, InsufficientStockError, InvalidCartItemError, InvalidCouponError, ProductNotFoundError } from '../errors';
import type { OrderRepository } from '../../infrastructure/repositories/order.repository';
import type { ProductRepository } from '../../infrastructure/repositories/product.repository';
import type { Order } from '../../domain/entities/order';

interface RequestedItem {
  productId: string;
  quantity: number;
}

export class CheckoutService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly orderRepository: OrderRepository,
    private readonly discountEngine: DiscountEngine = DiscountEngineFactory.create(config.discounts),
  ) {}

  async execute(dto: CheckoutRequestDTO): Promise<CheckoutResponseDTO> {
    const { cartItems, couponCode } = await this.buildCart(dto);

    const calculation = this.discountEngine.execute(cartItems, couponCode);

    for (const item of cartItems) {
      await this.productRepository.updateStock(item.product.id, item.quantity);
    }

    const order: Order = {
      orderId: randomUUID(),
      couponCode,
      items: cartItems,
      originalSubtotal: calculation.originalSubtotal,
      discountBreakdown: calculation.discountBreakdown,
      finalTotal: calculation.finalTotal,
      status: OrderStatus.COMPLETED,
      createdAt: new Date(),
    };
    await this.orderRepository.save(order);

    return {
      orderId: order.orderId,
      originalSubtotal: order.originalSubtotal,
      discountBreakdown: order.discountBreakdown,
      finalTotal: order.finalTotal,
      items: order.items,
    };
  }

  async preview(dto: CheckoutRequestDTO): Promise<CheckoutPreviewResponseDTO> {
    const { cartItems, couponCode } = await this.buildCart(dto);
    const calculation = this.discountEngine.execute(cartItems, couponCode);

    return {
      originalSubtotal: calculation.originalSubtotal,
      discountBreakdown: calculation.discountBreakdown,
      finalTotal: calculation.finalTotal,
      items: cartItems,
    };
  }

  private async buildCart(
    dto: CheckoutRequestDTO,
  ): Promise<{ cartItems: CartItem[]; couponCode: string | undefined }> {
    if (!dto.cartItems || dto.cartItems.length === 0) {
      throw new EmptyCartError();
    }

    if (dto.couponCode !== undefined && dto.couponCode !== config.discounts.couponCode) {
      throw new InvalidCouponError(dto.couponCode);
    }

    const requestedItems = this.aggregateQuantities(dto.cartItems);
    const productIds = requestedItems.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);
    const productsById = new Map<string, Product>(products.map((product) => [product.id, product]));

    const cartItems: CartItem[] = [];
    for (const requested of requestedItems) {
      const product = productsById.get(requested.productId);
      if (!product) {
        throw new ProductNotFoundError(requested.productId);
      }
      if (product.stock < requested.quantity) {
        throw new InsufficientStockError(requested.productId, product.stock, requested.quantity);
      }
      cartItems.push({ product, quantity: requested.quantity });
    }

    return { cartItems, couponCode: dto.couponCode };
  }

  private aggregateQuantities(items: CheckoutRequestDTO['cartItems']): RequestedItem[] {
    const aggregated = new Map<string, number>();

    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new InvalidCartItemError(item.productId);
      }
      aggregated.set(item.productId, (aggregated.get(item.productId) ?? 0) + item.quantity);
    }

    return Array.from(aggregated.entries()).map(([productId, quantity]) => ({ productId, quantity }));
  }
}