import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Category, type Product } from '@examen-ecommerce/shared';
import { api } from '../../../../shared/api/axiosClient';
import { cartReducer } from '../../cartSlice';
import { ProductList } from '../ProductList';

vi.mock('../../../../shared/api/axiosClient', () => ({
  api: { get: vi.fn() },
}));

const mockedGet = vi.mocked(api.get);

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
  stock: 0,
};

function renderProductList() {
  const store = configureStore({ reducer: { cart: cartReducer } });
  render(
    <Provider store={store}>
      <ProductList />
    </Provider>,
  );
  return store;
}

describe('ProductList', () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it('shows a loading message while fetching products', () => {
    mockedGet.mockReturnValue(new Promise(() => {}));
    renderProductList();

    expect(screen.getByText('Cargando productos…')).toBeInTheDocument();
  });

  it('renders products fetched from the API and adds them to the cart', async () => {
    mockedGet.mockResolvedValue({ data: [laptop, mug] } as never);
    const store = renderProductList();

    expect(await screen.findByText('Laptop Pro 2024')).toBeInTheDocument();
    expect(screen.getByText('Ceramic Coffee Mug')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledTimes(1);
    expect(mockedGet).toHaveBeenCalledWith('/products');

    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }));

    expect(store.getState().cart.items).toEqual([{ product: laptop, quantity: 1 }]);
  });

  it('disables the add button for products without stock', async () => {
    mockedGet.mockResolvedValue({ data: [mug] } as never);
    renderProductList();

    await screen.findByText('Ceramic Coffee Mug');

    expect(screen.getByRole('button', { name: 'Sin stock' })).toBeDisabled();
  });

  it('shows an error state and recovers on retry', async () => {
    mockedGet.mockRejectedValueOnce(new Error('Server error'));
    renderProductList();

    expect(await screen.findByText('No se pudieron cargar los productos.')).toBeInTheDocument();

    mockedGet.mockResolvedValueOnce({ data: [laptop] } as never);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByText('Laptop Pro 2024')).toBeInTheDocument();
    expect(mockedGet).toHaveBeenCalledTimes(2);
  });
});