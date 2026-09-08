import { DiscountEngine } from '../services/DiscountEngine';
import { CategoryDiscountStrategy } from '../strategies/CategoryDiscountStrategy';
import { CouponDiscountStrategy } from '../strategies/CouponDiscountStrategy';
import { MaxLimitDiscountStrategy } from '../strategies/MaxLimitDiscountStrategy';
import { VolumeDiscountStrategy } from '../strategies/VolumeDiscountStrategy';

export interface DiscountEngineOptions {
  categoryRate: number;
  volumeRate: number;
  volumeThreshold: number;
  couponRate: number;
  couponCode: string;
  maxRate: number;
}

export class DiscountEngineFactory {
  static create(options: DiscountEngineOptions): DiscountEngine {
    return new DiscountEngine([
      new CategoryDiscountStrategy(options.categoryRate),
      new VolumeDiscountStrategy(options.volumeRate, options.volumeThreshold),
      new CouponDiscountStrategy(options.couponRate, options.couponCode),
      new MaxLimitDiscountStrategy(options.maxRate),
    ]);
  }
}