import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { CartItem, CheckoutRequestDTO, CheckoutResponseDTO, DiscountBreakdown } from '@examen-ecommerce/shared';
import { api } from '../../shared/api/axiosClient';

export type CheckoutStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface CheckoutState {
  appliedCoupon: string | null;
  breakdown: DiscountBreakdown | null;
  status: CheckoutStatus;
  error: string | null;
  orderConfirmation: CheckoutResponseDTO | null;
}

const initialState: CheckoutState = {
  appliedCoupon: null,
  breakdown: null,
  status: 'idle',
  error: null,
  orderConfirmation: null,
};

export interface ProcessCheckoutPayload {
  cartItems: CartItem[];
  couponCode?: string;
}

export const processCheckout = createAsyncThunk<
  CheckoutResponseDTO,
  ProcessCheckoutPayload,
  { rejectValue: string }
>('checkout/processCheckout', async ({ cartItems, couponCode }, { rejectWithValue }) => {
  const request: CheckoutRequestDTO = {
    cartItems: cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
  };
  if (couponCode !== undefined) {
    request.couponCode = couponCode;
  }

  try {
    const response = await api.post<CheckoutResponseDTO>('/checkout', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = (error.response?.data as { error?: string } | undefined)?.error;
      return rejectWithValue(message ?? error.message);
    }
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setCoupon(state, action: PayloadAction<string>) {
      state.appliedCoupon = action.payload;
      state.breakdown = null;
      state.orderConfirmation = null;
      state.error = null;
      state.status = 'idle';
    },
    clearCheckout(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(processCheckout.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(processCheckout.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.orderConfirmation = action.payload;
        state.breakdown = action.payload.discountBreakdown;
        state.error = null;
      })
      .addCase(processCheckout.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error?.message ?? 'Checkout failed';
        state.orderConfirmation = null;
      });
  },
});

export const { setCoupon, clearCheckout } = checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;
export default checkoutReducer;