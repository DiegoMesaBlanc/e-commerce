import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CartItem } from '@examen-ecommerce/shared';

export interface CartState {
  items: CartItem[];
  originalSubtotal: number;
}

const initialState: CartState = {
  items: [],
  originalSubtotal: 0,
};

function recomputeSubtotal(state: CartState): void {
  state.originalSubtotal =
    Math.round(state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100;
}

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((item) => item.product.id === action.payload.product.id);
      if (existing) {
        existing.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }
      recomputeSubtotal(state);
    },
    removeFromCart(state, action: PayloadAction<{ productId: string }>) {
      state.items = state.items.filter((item) => item.product.id !== action.payload.productId);
      recomputeSubtotal(state);
    },
    updateQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const { productId, quantity } = action.payload;
      const index = state.items.findIndex((item) => item.product.id === productId);
      if (index >= 0) {
        if (quantity <= 0) {
          state.items.splice(index, 1);
        } else {
          state.items[index]!.quantity = quantity;
        }
      }
      recomputeSubtotal(state);
    },
    clearCart(state) {
      state.items = [];
      state.originalSubtotal = 0;
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;
export default cartReducer;