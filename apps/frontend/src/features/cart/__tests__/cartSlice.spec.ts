import { describe, expect, it } from 'vitest';
import { Category, type CartItem, type Product } from '@examen-ecommerce/shared';
import {
  addToCart,
  cartReducer,
  clearCart,
  removeFromCart,
  updateQuantity,
  type CartState,
} from '../cartSlice';

const laptop: Product = {
  id: 'product-laptop-pro',
  name: 'Laptop Pro 2024',
  price: 1500,
  category: Category.TECHNOLOGY,
  stock: 5,
};
const mug: Product = {
  id: 'product-ceramic-mug',
  name: 'Ceramic Coffee Mug',
  price: 10,
  category: Category.OTHER,
  stock: 40,
};

function toItem(product: Product, quantity: number): CartItem {
  return { product, quantity };
}

function stateWith(items: CartItem[]): CartState {
  return { items, originalSubtotal: 0 };
}

const initialState: CartState = { items: [], originalSubtotal: 0 };

describe('cartReducer', () => {
  it('starts empty with subtotal 0', () => {
    expect(cartReducer(undefined, { type: 'init' })).toEqual(initialState);
  });

  it('adds a new product and recomputes the subtotal', () => {
    const next = cartReducer(initialState, addToCart(toItem(laptop, 2)));

    expect(next.items).toEqual([toItem(laptop, 2)]);
    expect(next.originalSubtotal).toBe(3000);
  });

  it('aggregates the quantity of a product already in the cart', () => {
    const state = cartReducer(initialState, addToCart(toItem(laptop, 1)));
    const next = cartReducer(state, addToCart(toItem(laptop, 3)));

    expect(next.items).toEqual([toItem(laptop, 4)]);
    expect(next.originalSubtotal).toBe(6000);
  });

  it('removes a product and recomputes the subtotal', () => {
    let state = cartReducer(initialState, addToCart(toItem(laptop, 2)));
    state = cartReducer(state, addToCart(toItem(mug, 1)));
    const next = cartReducer(state, removeFromCart({ productId: laptop.id }));

    expect(next.items).toEqual([toItem(mug, 1)]);
    expect(next.originalSubtotal).toBe(10);
  });

  it('updateQuantity sets the new quantity and recomputes the subtotal', () => {
    const state = cartReducer(initialState, addToCart(toItem(mug, 2)));
    const next = cartReducer(state, updateQuantity({ productId: mug.id, quantity: 5 }));

    expect(next.items).toEqual([toItem(mug, 5)]);
    expect(next.originalSubtotal).toBe(50);
  });

  it('updateQuantity removes the line when quantity drops to 0', () => {
    const state = cartReducer(initialState, addToCart(toItem(laptop, 2)));
    const next = cartReducer(state, updateQuantity({ productId: laptop.id, quantity: 0 }));

    expect(next.items).toHaveLength(0);
    expect(next.originalSubtotal).toBe(0);
  });

  it('ignores updateQuantity for unknown products', () => {
    const state = cartReducer(stateWith([toItem(mug, 2)]), updateQuantity({ productId: 'missing', quantity: 9 }));

    expect(state.items).toEqual([toItem(mug, 2)]);
    expect(state.originalSubtotal).toBe(20);
  });

  it('clearCart resets items and subtotal', () => {
    let state = cartReducer(initialState, addToCart(toItem(laptop, 2)));
    state = cartReducer(state, addToCart(toItem(mug, 1)));
    const next = cartReducer(state, clearCart());

    expect(next).toEqual(initialState);
  });

  it('keeps a floating point subtotal accurate', () => {
    const headset: Product = { id: 'product-headphones-nc', name: 'Headphones', price: 199.99, category: Category.TECHNOLOGY, stock: 3 };
    const next = cartReducer(initialState, addToCart(toItem(headset, 3)));

    expect(next.originalSubtotal).toBe(599.97);
  });
});