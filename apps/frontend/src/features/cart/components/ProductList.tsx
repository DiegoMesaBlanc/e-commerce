import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@examen-ecommerce/shared';
import { useAppDispatch } from '../../../app/hooks';
import { api } from '../../../shared/api/axiosClient';
import { formatMoney } from '../../../shared/utils/format';
import { addToCart } from '../cartSlice';

type LoadStatus = 'loading' | 'success' | 'error';

interface ProductsResponse {
  products: Product[];
}

export function ProductList() {
  const dispatch = useAppDispatch();
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const loadProducts = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await api.get<ProductsResponse>('/products');
      setProducts(Array.isArray(data) ? data : data.products);
      setStatus('success');
    } catch {
      setProducts([]);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  if (status === 'loading') {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm" data-testid="product-list">
        <h2 className="mb-4 text-lg font-semibold">Productos</h2>
        <p className="text-sm text-gray-500">Cargando productos…</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Productos</h2>
        <p className="mb-4 text-sm text-red-600">No se pudieron cargar los productos.</p>
        <button
          type="button"
          onClick={() => void loadProducts()}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          Reintentar
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Productos</h2>
      <ul className="space-y-4">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex flex-col gap-3 rounded-lg border border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">{formatMoney(product.price)} · {product.category}</p>
              <p className="text-xs text-gray-400">Stock disponible: {product.stock}</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(addToCart({ product, quantity: 1 }))}
              disabled={product.stock <= 0}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}