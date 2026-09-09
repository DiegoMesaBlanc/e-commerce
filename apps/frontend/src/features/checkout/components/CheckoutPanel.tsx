import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { formatMoney, formatPercent } from '../../../shared/utils/format';
import { processCheckout, setCoupon } from '../checkoutSlice';

interface BreakdownRowProps {
  label: string;
  value: string;
}

function BreakdownRow({ label, value }: BreakdownRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <dt className="text-sm text-gray-600">{label}</dt>
      <dd className="text-sm font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

export function CheckoutPanel() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.cart.items);
  const { appliedCoupon, breakdown, status, error, orderConfirmation } = useAppSelector((state) => state.checkout);
  const [couponInput, setCouponInput] = useState('');

  const hasItems = items.length > 0;
  const isLoading = status === 'loading';

  const handleApplyCoupon = () => {
    dispatch(setCoupon(couponInput.trim()));
  };

  const handleCheckout = () => {
    void dispatch(processCheckout({ cartItems: items, couponCode: appliedCoupon ?? undefined }));
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Finalizar compra</h2>

      <div className="mb-4">
        <label htmlFor="coupon" className="mb-1 block text-sm font-medium text-gray-700">
          Cupón promocional
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value)}
            placeholder="Ej: WELCOME2026"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Aplicar Cupón
          </button>
        </div>
        {appliedCoupon && (
          <p data-testid="applied-coupon" className="mt-2 text-sm text-emerald-700">
            Cupón aplicado: <span className="font-semibold">{appliedCoupon}</span>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={!hasItems || isLoading}
        className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {isLoading ? 'Procesando…' : 'Finalizar Compra'}
      </button>

      {!hasItems && <p className="mt-2 text-xs text-gray-500">Agrega productos al carrito para finalizar la compra.</p>}
      {status === 'failed' && error && (
        <p data-testid="checkout-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {orderConfirmation && breakdown && (
        <dl data-testid="checkout-breakdown" className="mt-5 border-t border-gray-100 pt-4">
          <BreakdownRow label="Subtotal Original" value={formatMoney(orderConfirmation.originalSubtotal)} />
          <BreakdownRow label="Descuento de Categoría" value={`-${formatMoney(breakdown.categoryDiscount)}`} />
          <BreakdownRow label="Descuento por Volumen" value={`-${formatMoney(breakdown.volumeDiscount)}`} />
          <BreakdownRow label="Descuento por Cupón" value={`-${formatMoney(breakdown.couponDiscount)}`} />
          <BreakdownRow label="Porcentaje Efectivo Aplicado" value={formatPercent(breakdown.effectivePercentage)} />
          <BreakdownRow label="Total de Ahorro" value={`-${formatMoney(breakdown.totalSavings)}`} />
          <BreakdownRow label="Valor Final a Pagar" value={formatMoney(orderConfirmation.finalTotal)} />
        </dl>
      )}
    </section>
  );
}