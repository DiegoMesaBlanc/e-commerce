import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category, type CheckoutResponseDTO, type Product } from '@examen-ecommerce/shared';
import { api } from '../../../../shared/api/axiosClient';
import { cartReducer, addToCart } from '../../../cart/cartSlice';
import { checkoutReducer } from '../../checkoutSlice';
import { CheckoutPanel } from '../CheckoutPanel';

vi.mock('../../../../shared/api/axiosClient', () => ({
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

function createStore() {
  const store = configureStore({ reducer: { cart: cartReducer, checkout: checkoutReducer } });
  store.dispatch(addToCart({ product: laptop, quantity: 2 }));
  return store;
}

function renderPanel(store = createStore()) {
  render(
    <Provider store={store}>
      <CheckoutPanel />
    </Provider>,
  );
  return store;
}

async function completeCheckout() {
  mockedPost.mockResolvedValue({ data: confirmation } as never);
  renderPanel();
  fireEvent.click(screen.getByRole('button', { name: 'Finalizar Compra' }));
  await screen.findByTestId('checkout-breakdown');
}

describe('CheckoutPanel', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('stores the coupon code when Aplicar Cupón is clicked', () => {
    renderPanel();

    fireEvent.change(screen.getByLabelText('Cupón promocional'), { target: { value: '  WELCOME2026  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Cupón' }));

    expect(screen.getByTestId('applied-coupon')).toHaveTextContent('WELCOME2026');
  });

  it('keeps the checkout button disabled while the cart is empty', () => {
    const store = configureStore({ reducer: { cart: cartReducer, checkout: checkoutReducer } });
    renderPanel(store);

    expect(screen.getByRole('button', { name: 'Finalizar Compra' })).toBeDisabled();
    expect(screen.getByText('Agrega productos al carrito para finalizar la compra.')).toBeInTheDocument();
  });

  it('shows a loading state while the checkout request is pending', async () => {
    let resolvePost!: (value: { data: CheckoutResponseDTO }) => void;
    mockedPost.mockImplementation(
      () => new Promise((resolve) => (resolvePost = resolve)) as ReturnType<typeof api.post>,
    );
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar Compra' }));

    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled();

    resolvePost({ data: confirmation });
    await screen.findByTestId('checkout-breakdown');
  });

  it('renders the full discount breakdown after a successful checkout', async () => {
    mockedPost.mockResolvedValue({ data: confirmation } as never);
    renderPanel();
    fireEvent.change(screen.getByLabelText('Cupón promocional'), { target: { value: 'WELCOME2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar Cupón' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finalizar Compra' }));

    const breakdown = await screen.findByTestId('checkout-breakdown');
    const rows = within(breakdown);

    expect(rows.getByText('Subtotal Original')).toBeInTheDocument();
    expect(rows.getByText('$3000.00')).toBeInTheDocument();
    expect(rows.getByText('Descuento de Categoría')).toBeInTheDocument();
    expect(rows.getByText('-$300.00')).toBeInTheDocument();
    expect(rows.getByText('Descuento por Volumen')).toBeInTheDocument();
    expect(rows.getByText('-$135.00')).toBeInTheDocument();
    expect(rows.getByText('Descuento por Cupón')).toBeInTheDocument();
    expect(rows.getByText('-$384.75')).toBeInTheDocument();
    expect(rows.getByText('Porcentaje Efectivo Aplicado')).toBeInTheDocument();
    expect(rows.getByText('27.33%')).toBeInTheDocument();
    expect(rows.getByText('Total de Ahorro')).toBeInTheDocument();
    expect(rows.getByText('-$819.75')).toBeInTheDocument();
    expect(rows.getByText('Valor Final a Pagar')).toBeInTheDocument();
    expect(rows.getByText('$2180.25')).toBeInTheDocument();

    expect(mockedPost).toHaveBeenCalledWith('/checkout', {
      cartItems: [{ productId: laptop.id, quantity: 2 }],
      couponCode: 'WELCOME2026',
    });
  });

  it('sends the request without a coupon when none was applied', async () => {
    await completeCheckout();

    expect(mockedPost).toHaveBeenCalledTimes(1);
    expect(mockedPost).toHaveBeenCalledWith('/checkout', {
      cartItems: [{ productId: laptop.id, quantity: 2 }],
    });
  });

  it('shows the backend error message when the checkout fails', async () => {
    mockedPost.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 400',
      response: { data: { error: 'Insufficient stock for product "product-laptop-pro".' } },
    });
    renderPanel();

    fireEvent.click(screen.getByRole('button', { name: 'Finalizar Compra' }));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toHaveTextContent(
        'Insufficient stock for product "product-laptop-pro".',
      );
    });
  });
});