import { DiscountEngine } from '../services/DiscountEngine';
import { CategoryDiscountStrategy } from '../strategies/CategoryDiscountStrategy';
import { CouponDiscountStrategy } from '../strategies/CouponDiscountStrategy';
import { MaxLimitDiscountStrategy } from '../strategies/MaxLimitDiscountStrategy';
import { VolumeDiscountStrategy } from '../strategies/VolumeDiscountStrategy';

export class DiscountEngineFactory {
  static create(): DiscountEngine {
    return new DiscountEngine([
      new CategoryDiscountStrategy(),
      new VolumeDiscountStrategy(),
      new CouponDiscountStrategy(),
      new MaxLimitDiscountStrategy(),
    ]);
  }
}