import { useEffect, useState, type ChangeEvent } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { formatMoney, formatPercent } from '../../../shared/utils/format';
import { previewCheckout, processCheckout, setCoupon } from '../checkoutSlice';

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
  const { appliedCoupon, breakdown, status, error, orderConfirmation, preview, previewStatus } = useAppSelector(
    (state) => state.checkout,
  );
  const [couponInput, setCouponInput] = useState('');

  const hasItems = items.length > 0;
  const isLoading = status === 'loading';

  useEffect(() => {
    if (hasItems && appliedCoupon) {
      void dispatch(previewCheckout({ cartItems: items, couponCode: appliedCoupon }));
    }
  }, [items, appliedCoupon, hasItems, dispatch]);

  const handleApplyCoupon = () => {
    dispatch(setCoupon(couponInput.trim()));
  };

  const handleCouponChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCouponInput(event.target.value);
    if (appliedCoupon) {
      dispatch(setCoupon(''));
    }
  };

  const handleCheckout = () => {
    const couponCode = couponInput.trim() || undefined;
    void dispatch(processCheckout({ cartItems: items, couponCode }));
  };

  const summary = orderConfirmation ?? preview;
  const showBreakdown = summary !== null && breakdown !== null;

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
            onChange={handleCouponChange}
            placeholder="Ej: WELCOME2026"
            className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={handleApplyCoupon}
            disabled={previewStatus === 'loading'}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            Aplicar Cupón
          </button>
        </div>
        {appliedCoupon && (
          <p data-testid="applied-coupon" className="mt-2 text-sm text-emerald-700">
            Cupón aplicado: <span className="font-semibold">{appliedCoupon}</span>
          </p>
        )}
        {previewStatus === 'loading' && (
          <p data-testid="preview-loading" className="mt-2 text-xs text-gray-500">
            Calculando descuento…
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

      {showBreakdown && summary && breakdown && (
        <>
          {!orderConfirmation && (
            <p data-testid="preview-note" className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400">
              Vista previa del descuento
            </p>
          )}
          <dl data-testid="checkout-breakdown" className="mt-2 border-t border-gray-100 pt-4">
            <BreakdownRow label="Subtotal Original" value={formatMoney(summary.originalSubtotal)} />
            <BreakdownRow label="Descuento de Categoría" value={`-${formatMoney(breakdown.categoryDiscount)}`} />
            <BreakdownRow label="Descuento por Volumen" value={`-${formatMoney(breakdown.volumeDiscount)}`} />
            <BreakdownRow label="Descuento por Cupón" value={`-${formatMoney(breakdown.couponDiscount)}`} />
            <BreakdownRow label="Porcentaje Efectivo Aplicado" value={formatPercent(breakdown.effectivePercentage)} />
            <BreakdownRow label="Total de Ahorro" value={`-${formatMoney(breakdown.totalSavings)}`} />
            <BreakdownRow label="Valor Final a Pagar" value={formatMoney(summary.finalTotal)} />
          </dl>
        </>
      )}
    </section>
  );
}