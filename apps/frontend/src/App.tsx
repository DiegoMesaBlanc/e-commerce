import { useAppSelector } from './app/hooks';
import { CartView } from './features/cart/components/CartView';
import { ProductList } from './features/cart/components/ProductList';
import { CheckoutPanel } from './features/checkout/components/CheckoutPanel';
import { LimitReachedAlert } from './features/checkout/components/LimitReachedAlert';

const MAX_DISCOUNT_PERCENTAGE = 35;

export function App() {
  const breakdown = useAppSelector((state) => state.checkout.breakdown);
  const limitReached =
    breakdown?.limitReached === true || (breakdown?.effectivePercentage ?? 0) >= MAX_DISCOUNT_PERCENTAGE;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">E-Commerce</h1>
          <p className="mt-1 text-sm text-gray-500">
            Encuentra tus productos favoritos y finaliza tu compra con el mejor descuento.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-2">
        <ProductList />
        <div className="space-y-6">
          <CartView />
          <LimitReachedAlert limitReached={limitReached} />
          <CheckoutPanel />
        </div>
      </main>
    </div>
  );
}