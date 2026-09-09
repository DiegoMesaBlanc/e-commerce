import { configureStore } from '@reduxjs/toolkit';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category, type CartItem, type CheckoutResponseDTO, type Product } from '@examen-ecommerce/shared';
import { api } from '../../../shared/api/axiosClient';
import {
  checkoutReducer,
  clearCheckout,
  processCheckout,
  setCoupon,
  type CheckoutState,
} from '../checkoutSlice';

vi.mock('../../../shared/api/axiosClient', () => ({
  api: { post: vi.fn() },
}));

const mockedPost = vi.mocked(api.post);

const laptop: Product = {
  id: 'product-laptop-pro',
  name: 'Laptop Pro 2024',
  price: 1500,
  category: Category.TECHNOLOGY,
  stock: 5,
};

const cartItems: CartItem[] = [{ product: laptop, quantity: 2 }];

const confirmation: CheckoutResponseDTO = {
  orderId: 'order-123',
  originalSubtotal: 3000,
  discountBreakdown: {
    categoryDiscount: 300,
    volumeDiscount: 135,
    couponDiscount: 384.75,
    effectivePercentage: 27.33,
    totalSavings: 819.75,
    limitReached: false,
  },
  finalTotal: 2180.25,
  items: [{ product: laptop, quantity: 2 }],
};

const initialState: CheckoutState = {
  appliedCoupon: null,
  breakdown: null,
  status: 'idle',
  error: null,
  orderConfirmation: null,
};

function createStore() {
  return configureStore({ reducer: { checkout: checkoutReducer } });
}

describe('checkoutReducer', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('starts in idle state', () => {
    expect(checkoutReducer(undefined, { type: 'init' })).toEqual(initialState);
  });

  it('setCoupon stores the coupon and invalidates previous results', () => {
    const applied = checkoutReducer(
      { ...initialState, orderConfirmation: confirmation, breakdown: confirmation.discountBreakdown },
      setCoupon('WELCOME2026'),
    );

    expect(applied.appliedCoupon).toBe('WELCOME2026');
    expect(applied.orderConfirmation).toBeNull();
    expect(applied.breakdown).toBeNull();
    expect(applied.status).toBe('idle');
    expect(applied.error).toBeNull();
  });

  it('clearCheckout resets the whole state', () => {
    const next = checkoutReducer(
      { ...initialState, appliedCoupon: 'WELCOME2026', orderConfirmation: confirmation },
      clearCheckout(),
    );

    expect(next).toEqual(initialState);
  });

  it('sets loading while the request is pending', () => {
    const next = checkoutReducer(initialState, { type: processCheckout.pending.type });

    expect(next.status).toBe('loading');
    expect(next.error).toBeNull();
  });

  it('stores the order confirmation on success', async () => {
    const store = createStore();
    mockedPost.mockResolvedValue({ data: confirmation } as never);

    await store.dispatch(processCheckout({ cartItems, couponCode: 'WELCOME2026' }));

    const state = store.getState().checkout;
    expect(state.status).toBe('succeeded');
    expect(state.orderConfirmation).toEqual(confirmation);
    expect(state.breakdown).toEqual(confirmation.discountBreakdown);
    expect(state.error).toBeNull();
    expect(mockedPost).toHaveBeenCalledWith('/checkout', {
      cartItems: [{ productId: laptop.id, quantity: 2 }],
      couponCode: 'WELCOME2026',
    });
  });

  it('sends the request without a coupon when none is given', async () => {
    const store = createStore();
    mockedPost.mockResolvedValue({ data: confirmation } as never);

    await store.dispatch(processCheckout({ cartItems }));

    expect(mockedPost).toHaveBeenCalledWith('/checkout', {
      cartItems: [{ productId: laptop.id, quantity: 2 }],
    });
  });

  it('surfaces the backend error message on an axios error response', async () => {
    const store = createStore();
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 400',
      response: { data: { error: 'Insufficient stock for product "product-laptop-pro".' } },
    });

    await store.dispatch(processCheckout({ cartItems, couponCode: 'WELCOME2026' }));

    const state = store.getState().checkout;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Insufficient stock for product "product-laptop-pro".');
    expect(state.orderConfirmation).toBeNull();
  });

  it('falls back to the network error message on a generic failure', async () => {
    const store = createStore();
    mockedPost.mockRejectedValue(new Error('Network Error'));

    await store.dispatch(processCheckout({ cartItems }));

    const state = store.getState().checkout;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network Error');
  });

  it('falls back to "Unknown error" when the rejection is not an Error or axios error', async () => {
    const store = createStore();
    mockedPost.mockRejectedValue('boom');

    await store.dispatch(processCheckout({ cartItems }));

    const state = store.getState().checkout;
    expect(state.status).toBe('failed');
    expect(state.error).toBe('Unknown error');
  });

  it('uses the action error message when the thunk rejects without a payload', () => {
    const next = checkoutReducer(initialState, {
      type: processCheckout.rejected.type,
      error: { message: 'Server exploded' },
    });

    expect(next.status).toBe('failed');
    expect(next.error).toBe('Server exploded');
    expect(next.orderConfirmation).toBeNull();
  });

  it('uses a generic message when no rejection details are available', () => {
    const next = checkoutReducer(initialState, { type: processCheckout.rejected.type });

    expect(next.status).toBe('failed');
    expect(next.error).toBe('Checkout failed');
  });
});