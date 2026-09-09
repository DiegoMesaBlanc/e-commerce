import { useEffect } from 'react';
import toast from 'react-hot-toast';

export const LIMIT_REACHED_MESSAGE =
  '¡Enhorabuena! Has alcanzado el límite máximo de ahorro permitido (35%)';

const LIMIT_TOAST_ID = 'limit-reached-toast';

interface LimitReachedAlertProps {
  limitReached: boolean;
}

export function LimitReachedAlert({ limitReached }: LimitReachedAlertProps) {
  useEffect(() => {
    if (limitReached) {
      toast.success(LIMIT_REACHED_MESSAGE, { id: LIMIT_TOAST_ID, duration: Infinity });
    }
    return () => {
      toast.dismiss(LIMIT_TOAST_ID);
    };
  }, [limitReached]);

  if (!limitReached) {
    return null;
  }

  return (
    <div
      role="alert"
      data-testid="limit-reached-alert"
      className="flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm"
    >
      <p className="text-sm font-medium text-amber-800">{LIMIT_REACHED_MESSAGE}</p>
    </div>
  );
}