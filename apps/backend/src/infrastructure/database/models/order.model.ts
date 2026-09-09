import { Schema, model } from 'mongoose';
import { OrderStatus } from '@examen-ecommerce/shared';

const orderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    couponCode: { type: String },
    items: [
      {
        _id: false,
        product: {
          id: String,
          name: String,
          price: Number,
          category: String,
          stock: Number,
        },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    originalSubtotal: { type: Number, required: true },
    discountBreakdown: {
      _id: false,
      categoryDiscount: Number,
      volumeDiscount: Number,
      couponDiscount: Number,
      effectivePercentage: Number,
      totalSavings: Number,
      limitReached: Boolean,
    },
    finalTotal: { type: Number, required: true },
    status: { type: String, enum: Object.values(OrderStatus), required: true },
  },
  { timestamps: true },
);

export const OrderModel = model('Order', orderSchema);