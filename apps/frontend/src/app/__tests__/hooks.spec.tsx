import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { Category, type Product } from '@examen-ecommerce/shared';
import { addToCart, clearCart } from '../../features/cart/cartSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import { store } from '../store';

const laptop: Product = {
  id: 'product-laptop-pro',
  name: 'Laptop Pro 2024',
  price: 1500,
  category: Category.TECHNOLOGY,
  stock: 5,
};

const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

describe('redux hooks', () => {
  it('dispatches actions and selects state through the typed hooks', () => {
    const { result } = renderHook(
      () => ({
        dispatch: useAppDispatch(),
        items: useAppSelector((state) => state.cart.items),
        subtotal: useAppSelector((state) => state.cart.originalSubtotal),
        checkoutStatus: useAppSelector((state) => state.checkout.status),
      }),
      { wrapper },
    );

    expect(result.current.items).toHaveLength(0);
    expect(result.current.subtotal).toBe(0);
    expect(result.current.checkoutStatus).toBe('idle');

    act(() => {
      result.current.dispatch(addToCart({ product: laptop, quantity: 2 }));
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.subtotal).toBe(3000);

    act(() => {
      result.current.dispatch(clearCart());
    });

    expect(result.current.subtotal).toBe(0);
  });
});