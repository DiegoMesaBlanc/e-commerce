import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { Category, type CartItem, type Product } from '@examen-ecommerce/shared';
import { addToCart, cartReducer } from '../../cartSlice';
import { CartView } from '../CartView';

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

function item(product: Product, quantity: number): CartItem {
  return { product, quantity };
}

function renderCart(initialItems: CartItem[] = []) {
  const store = configureStore({ reducer: { cart: cartReducer } });
  initialItems.forEach((cartItem) => store.dispatch(addToCart(cartItem)));

  render(
    <Provider store={store}>
      <CartView />
    </Provider>,
  );

  return store;
}

describe('CartView', () => {
  it('shows an empty message when there are no items', () => {
    renderCart();

    expect(screen.getByText('Tu carrito está vacío. Agrega productos para continuar.')).toBeInTheDocument();
    expect(screen.queryByTestId('cart-subtotal')).not.toBeInTheDocument();
  });

  it('renders added products with a reactive subtotal', () => {
    renderCart([item(laptop, 2), item(mug, 1)]);

    expect(screen.getByText('Laptop Pro 2024')).toBeInTheDocument();
    expect(screen.getByText('Ceramic Coffee Mug')).toBeInTheDocument();
    expect(screen.getByTestId('quantity-product-laptop-pro')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$3010.00');
  });

  it('increases the quantity and recomputes the subtotal on "+"', () => {
    const store = renderCart([item(mug, 1)]);

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Ceramic Coffee Mug' }));

    expect(screen.getByTestId('quantity-product-ceramic-mug')).toHaveTextContent('2');
    expect(screen.getByTestId('line-total-product-ceramic-mug')).toHaveTextContent('$20.00');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$20.00');
    expect(store.getState().cart.originalSubtotal).toBe(20);
  });

  it('decreases the quantity with "−" and recomputes the subtotal', () => {
    renderCart([item(laptop, 2)]);

    fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Laptop Pro 2024' }));

    expect(screen.getByTestId('quantity-product-laptop-pro')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$1500.00');
  });

  it('removes the product line when quantity reaches zero', () => {
    renderCart([item(mug, 1)]);

    fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Ceramic Coffee Mug' }));

    expect(screen.getByText('Tu carrito está vacío. Agrega productos para continuar.')).toBeInTheDocument();
    expect(screen.queryByText('Ceramic Coffee Mug')).not.toBeInTheDocument();
  });

  it('deletes a product with the Eliminar button', () => {
    renderCart([item(laptop, 3), item(mug, 2)]);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar Ceramic Coffee Mug' }));

    expect(screen.queryByText('Ceramic Coffee Mug')).not.toBeInTheDocument();
    expect(screen.getByText('Laptop Pro 2024')).toBeInTheDocument();
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$4500.00');
  });

  it('keeps stocks and prices per product line', () => {
    renderCart([item(laptop, 1)]);

    const line = screen.getByText('Laptop Pro 2024').closest('li');
    expect(line).not.toBeNull();
    expect(within(line as HTMLElement).getByText('$1500.00')).toBeInTheDocument();
  });
});