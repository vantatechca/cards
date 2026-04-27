import { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { formatUsd, formatCad } from '../utils/formatters';
import { getUsdToCadRate } from '../services/currency/currencyService';
import { USD_TO_CAD_RATE } from '../utils/constants';

export function useCurrency() {
  const currency = useAppStore((s) => s.defaultCurrency);
  const [rate, setRate] = useState(USD_TO_CAD_RATE);

  useEffect(() => {
    getUsdToCadRate().then(setRate).catch(() => {});
  }, []);

  function formatValue(usd: number | null | undefined, cad?: number | null | undefined): string {
    if (currency === 'CAD') {
      const cadVal = cad ?? (usd != null ? Math.round(usd * rate * 100) / 100 : null);
      return formatCad(cadVal);
    }
    return formatUsd(usd);
  }

  return { currency, formatValue, rate };
}
