import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { Category, type CheckoutResponseDTO, type Product } from '@examen-ecommerce/shared';
import { App } from './App';
import { api } from './shared/api/axiosClient';
import { checkoutReducer, processCheckout } from './features/checkout/checkoutSlice';
import { cartReducer, addToCart } from './features/cart/cartSlice';

vi.mock('./shared/api/axiosClient', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

const laptop: Product = {
  id: 'product-laptop-pro',
  name: 'Laptop Pro 2024',
  price: 1500,
  category: Category.TECHNOLOGY,
  stock: 5,
};

const confirmation: CheckoutResponseDTO = {
  orderId: 'order-123',
  originalSubtotal: 3000,
  discountBreakdown: {
    categoryDiscount: 300,
    volumeDiscount: 135,
    couponDiscount: 0,
    effectivePercentage: 35,
    totalSavings: 435,
    limitReached: true,
  },
  finalTotal: 1950,
  items: [{ product: laptop, quantity: 2 }],
};

function createStore() {
  return configureStore({ reducer: { cart: cartReducer, checkout: checkoutReducer } });
}

function renderApp(store = createStore()) {
  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
  return store;
}

describe('App', () => {
  afterEach(() => {
    toast.dismiss();
  });

  beforeEach(() => {
    mockedGet.mockReset();
    mockedGet.mockResolvedValue({ data: { products: [laptop] } } as never);
  });

  it('renders the full layout with an empty cart', async () => {
    renderApp();

    expect(screen.getByRole('heading', { level: 1, name: 'E-Commerce' })).toBeInTheDocument();
    expect(await screen.findByText('Laptop Pro 2024')).toBeInTheDocument();
    expect(screen.getByText('Tu carrito está vacío. Agrega productos para continuar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar Compra' })).toBeDisabled();
    expect(screen.queryByTestId('limit-reached-alert')).not.toBeInTheDocument();
  });

  it('adds products to the cart from the product list', async () => {
    const store = renderApp();
    await screen.findByText('Laptop Pro 2024');

    screen.getByRole('button', { name: 'Agregar al carrito' }).click();

    expect(store.getState().cart.items).toHaveLength(1);
    expect(await screen.findByTestId('quantity-product-laptop-pro')).toHaveTextContent('1');
  });

  it('shows the limit reached alert when the breakdown reaches 35%', async () => {
    const store = createStore();
    store.dispatch(addToCart({ product: laptop, quantity: 2 }));
    store.dispatch({ type: processCheckout.fulfilled.type, payload: confirmation });

    renderApp(store);

    await screen.findByText('Laptop Pro 2024');
    const alert = await screen.findByTestId('limit-reached-alert');
    expect(alert).toHaveTextContent('35%');
    expect(alert).toHaveTextContent(
      '¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)',
    );
    expect(screen.getByTestId('checkout-breakdown')).toBeInTheDocument();
  });
});