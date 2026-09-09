import { Category, type CartItem } from '@examen-ecommerce/shared';
import type { DiscountContext, DiscountResult, IDiscountStrategy } from '../strategies/IDiscountStrategy';
import { DiscountStrategyName, WELCOME2026_COUPON } from '../strategies/IDiscountStrategy';
import { CategoryDiscountStrategy } from '../strategies/CategoryDiscountStrategy';
import { MaxLimitDiscountStrategy, MAX_DISCOUNT_RATE } from '../strategies/MaxLimitDiscountStrategy';
import { CouponDiscountStrategy } from '../strategies/CouponDiscountStrategy';
import { VolumeDiscountStrategy } from '../strategies/VolumeDiscountStrategy';
import { DiscountEngine, type DiscountEngineResult } from '../services/DiscountEngine';
import { DiscountEngineFactory } from '../factory/DiscountEngineFactory';

function cartItem(price: number, category: Category = Category.OTHER, quantity = 1): CartItem {
  return {
    product: {
      id: `product-${category}-${price}`,
      name: `Product ${category} ${price}`,
      price,
      category,
      stock: 10,
    },
    quantity,
  };
}

class AggressiveCouponStrategy implements IDiscountStrategy {
  readonly name = DiscountStrategyName.COUPON;

  apply(context: DiscountContext): DiscountResult {
    return {
      discountAmount: context.runningSubtotal * 0.5,
      applied: true,
      limitReached: false,
    };
  }
}

describe('DiscountEngine - Category discount (Rule 1)', () => {
  it('aplica 10% solo sobre los productos TECHNOLOGY', () => {
    const engine = DiscountEngineFactory.create();
    const cart = [cartItem(60, Category.TECHNOLOGY), cartItem(40, Category.TECHNOLOGY)];

    const result = engine.execute(cart);

    expect(result.originalSubtotal).toBe(100);
    expect(result.discountBreakdown.categoryDiscount).toBeCloseTo(10);
    expect(result.discountBreakdown.volumeDiscount).toBe(0);
    expect(result.discountBreakdown.couponDiscount).toBe(0);
    expect(result.discountBreakdown.totalSavings).toBeCloseTo(10);
    expect(result.discountBreakdown.effectivePercentage).toBeCloseTo(10);
    expect(result.finalTotal).toBeCloseTo(90);
    expect(result.discountBreakdown.limitReached).toBe(false);
  });

  it('no descuenta productos OTHER', () => {
    const engine = DiscountEngineFactory.create();
    const cart = [cartItem(60, Category.TECHNOLOGY), cartItem(40, Category.OTHER)];

    const result = engine.execute(cart);

    expect(result.discountBreakdown.categoryDiscount).toBeCloseTo(6);
    expect(result.originalSubtotal).toBe(100);
    expect(result.finalTotal).toBeCloseTo(94);
  });
});

describe('DiscountEngine - Volume discount (Rule 2)', () => {
  it('aplica 5% cuando el subtotal (tras categoría) supera $100', () => {
    const engine = DiscountEngineFactory.create();
    const cart = [cartItem(120, Category.OTHER)];

    const result = engine.execute(cart);

    expect(result.originalSubtotal).toBe(120);
    expect(result.discountBreakdown.volumeDiscount).toBeCloseTo(6);
    expect(result.discountBreakdown.totalSavings).toBeCloseTo(6);
    expect(result.discountBreakdown.effectivePercentage).toBeCloseTo(5);
    expect(result.finalTotal).toBeCloseTo(114);
  });

  it('no aplica volumen si el subtotal es exactamente $100', () => {
    const engine = DiscountEngineFactory.create();
    const result = engine.execute([cartItem(100, Category.OTHER)]);

    expect(result.discountBreakdown.volumeDiscount).toBe(0);
    expect(result.finalTotal).toBe(100);
  });

  it('calcula el volumen sobre el subtotal posterior a la categoría (cascada)', () => {
    const engine = DiscountEngineFactory.create();
    const cart = [cartItem(200, Category.TECHNOLOGY), cartItem(50, Category.OTHER)];

    const result = engine.execute(cart);

    expect(result.originalSubtotal).toBe(250);
    expect(result.discountBreakdown.categoryDiscount).toBeCloseTo(20);
    expect(result.discountBreakdown.volumeDiscount).toBeCloseTo(11.5);
    expect(result.finalTotal).toBeCloseTo(218.5);
  });
});

describe('DiscountEngine - Coupon discount (Rule 3)', () => {
  it('aplica 15% cuando el cupón es WELCOME2026', () => {
    const engine = DiscountEngineFactory.create();
    const result = engine.execute([cartItem(100, Category.OTHER)], WELCOME2026_COUPON);

    expect(result.discountBreakdown.couponDiscount).toBeCloseTo(15);
    expect(result.discountBreakdown.effectivePercentage).toBeCloseTo(15);
    expect(result.finalTotal).toBeCloseTo(85);
  });

  it('no aplica descuento con cupón inválido', () => {
    const engine = DiscountEngineFactory.create();
    const result = engine.execute([cartItem(100, Category.OTHER)], 'INVALID');

    expect(result.discountBreakdown.couponDiscount).toBe(0);
    expect(result.finalTotal).toBe(100);
  });

  it('no aplica descuento si no se envía cupón', () => {
    const engine = DiscountEngineFactory.create();
    const result = engine.execute([cartItem(100, Category.OTHER)]);

    expect(result.discountBreakdown.couponDiscount).toBe(0);
    expect(result.finalTotal).toBe(100);
  });

  it('aplica el cupón sobre el monto posterior al volumen (cascada)', () => {
    const engine = DiscountEngineFactory.create();
    const result = engine.execute([cartItem(200, Category.OTHER)], WELCOME2026_COUPON);

    expect(result.discountBreakdown.volumeDiscount).toBeCloseTo(10);
    expect(result.discountBreakdown.couponDiscount).toBeCloseTo(28.5);
    expect(result.finalTotal).toBeCloseTo(161.5);
  });
});

describe('DiscountEngine - Límite absoluto del 35% (Rule 4)', () => {
  it('trunca los descuentos exactamente al 35% y marca limitReached=true', () => {
    const engine = new DiscountEngine([
      new CategoryDiscountStrategy(),
      new VolumeDiscountStrategy(),
      new AggressiveCouponStrategy(),
      new MaxLimitDiscountStrategy(),
    ]);

    const result = engine.execute([cartItem(100, Category.OTHER)], WELCOME2026_COUPON);

    expect(result.discountBreakdown.limitReached).toBe(true);
    expect(result.discountBreakdown.totalSavings).toBeCloseTo(35);
    expect(result.discountBreakdown.effectivePercentage).toBeCloseTo(MAX_DISCOUNT_RATE * 100);
    expect(result.finalTotal).toBeCloseTo(65);
  });

  it('MaxLimitDiscountStrategy devuelve la reversión del excedente', () => {
    const strategy = new MaxLimitDiscountStrategy();
    const context: DiscountContext = {
      cartItems: [],
      couponCode: undefined,
      originalSubtotal: 100,
      runningSubtotal: 50,
    };

    const result = strategy.apply(context);

    expect(result.limitReached).toBe(true);
    expect(result.applied).toBe(true);
    expect(result.discountAmount).toBeCloseTo(-15);
  });

  it('MaxLimitDiscountStrategy no actúa si no se supera el 35%', () => {
    const strategy = new MaxLimitDiscountStrategy();
    const context: DiscountContext = {
      cartItems: [],
      couponCode: undefined,
      originalSubtotal: 100,
      runningSubtotal: 80,
    };

    const result = strategy.apply(context);

    expect(result.limitReached).toBe(false);
    expect(result.applied).toBe(false);
    expect(result.discountAmount).toBe(0);
  });

  it('con la configuración real el tope máximo acumulado no supera el 35%', () => {
    const engine = DiscountEngineFactory.create();
    const cart = [cartItem(500, Category.TECHNOLOGY), cartItem(100, Category.OTHER)];

    const result = engine.execute(cart, WELCOME2026_COUPON);

    expect(result.discountBreakdown.limitReached).toBe(false);
    expect(result.discountBreakdown.effectivePercentage).toBeLessThan(MAX_DISCOUNT_RATE * 100);
  });
});

describe('DiscountEngine - Carrito vacío y subtotal $0', () => {
  it('procesa un carrito vacío sin errores', () => {
    const engine = DiscountEngineFactory.create();

    const result: DiscountEngineResult = engine.execute([]);

    expect(result.originalSubtotal).toBe(0);
    expect(result.discountBreakdown.totalSavings).toBe(0);
    expect(result.discountBreakdown.effectivePercentage).toBe(0);
    expect(result.discountBreakdown.limitReached).toBe(false);
    expect(result.finalTotal).toBe(0);
  });

  it('procesa un carrito con subtotal $0', () => {
    const engine = DiscountEngineFactory.create();

    const result = engine.execute([cartItem(0, Category.TECHNOLOGY)]);

    expect(result.originalSubtotal).toBe(0);
    expect(result.discountBreakdown.totalSavings).toBe(0);
    expect(result.discountBreakdown.effectivePercentage).toBe(0);
    expect(result.finalTotal).toBe(0);
  });
});

describe('DiscountEngine - Estrategias individuales', () => {
  it('CategoryDiscountStrategy no aplica descuento sin productos TECHNOLOGY', () => {
    const strategy = new CategoryDiscountStrategy();
    const context: DiscountContext = {
      cartItems: [cartItem(50, Category.OTHER)],
      couponCode: undefined,
      originalSubtotal: 50,
      runningSubtotal: 50,
    };

    const result = strategy.apply(context);

    expect(result.discountAmount).toBe(0);
    expect(result.applied).toBe(false);
  });

  it('VolumeDiscountStrategy respeta el umbral de $100 estricto', () => {
    const strategy = new VolumeDiscountStrategy();
    const context: DiscountContext = {
      cartItems: [],
      couponCode: undefined,
      originalSubtotal: 100,
      runningSubtotal: 100,
    };

    const result = strategy.apply(context);

    expect(result.discountAmount).toBe(0);
    expect(result.applied).toBe(false);
  });

  it('CouponDiscountStrategy exige el código exacto WELCOME2026', () => {
    const strategy = new CouponDiscountStrategy();
    const context: DiscountContext = {
      cartItems: [],
      couponCode: 'welcome2026',
      originalSubtotal: 100,
      runningSubtotal: 100,
    };

    const result = strategy.apply(context);

    expect(result.discountAmount).toBe(0);
    expect(result.applied).toBe(false);
  });

  it('lanza error si falta la estrategia requerida', () => {
    const engine = new DiscountEngine([new CategoryDiscountStrategy()]);

    expect(() => engine.execute([cartItem(10)])).toThrow('Missing discount strategy');
  });
});