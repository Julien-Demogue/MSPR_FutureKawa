import { useEffect, useState } from 'react';
import { ComputedLot, fetchStockOverview } from '../api/stocks.api';

interface StockOverviewState {
  lots: ComputedLot[];
  loading: boolean;
  error: boolean;
}

export function useStockOverview(): StockOverviewState {
  const [state, setState] = useState<StockOverviewState>({ lots: [], loading: true, error: false });

  useEffect(() => {
    let cancelled = false;
    fetchStockOverview()
      .then((lots) => {
        if (!cancelled) setState({ lots, loading: false, error: false });
      })
      .catch(() => {
        if (!cancelled) setState({ lots: [], loading: false, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
