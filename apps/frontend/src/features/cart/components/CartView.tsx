import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { formatMoney } from '../../../shared/utils/format';
import { removeFromCart, updateQuantity } from '../cartSlice';

export function CartView() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const subtotal = useAppSelector((state) => state.cart.originalSubtotal);

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Carrito de compras</h2>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">Tu carrito está vacío. Agrega productos para continuar.</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-100">
            {items.map((item) => (
              <li key={item.product.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-gray-900">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">{formatMoney(item.product.price)} c/u</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Disminuir cantidad de ${item.product.name}`}
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity - 1 }))}
                    className="h-7 w-7 rounded-md bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                  >
                    −
                  </button>
                  <span data-testid={`quantity-${item.product.id}`} className="w-6 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label={`Aumentar cantidad de ${item.product.name}`}
                    onClick={() => dispatch(updateQuantity({ productId: item.product.id, quantity: item.quantity + 1 }))}
                    className="h-7 w-7 rounded-md bg-gray-100 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${item.product.name}`}
                    onClick={() => dispatch(removeFromCart({ productId: item.product.id }))}
                    className="ml-2 rounded-md px-2 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </div>

                <div data-testid={`line-total-${item.product.id}`} className="text-sm font-semibold text-gray-900">
                  {formatMoney(item.product.price * item.quantity)}
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-600">Subtotal original</span>
            <span data-testid="cart-subtotal" className="text-xl font-bold text-gray-900">
              {formatMoney(subtotal)}
            </span>
          </div>
        </>
      )}
    </section>
  );
}