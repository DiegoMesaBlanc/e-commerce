import { Schema, model } from 'mongoose';
import { Category } from '@examen-ecommerce/shared';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, enum: Object.values(Category), required: true },
    stock: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const ProductModel = model('Product', productSchema);