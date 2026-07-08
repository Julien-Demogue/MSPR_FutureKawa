import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { parseAppRole } from '../constants/roles.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import {
  visibleLotsFor, fetchWarehouseHistory, formatStoredDate,
  HISTORY_RANGES, DEFAULT_HISTORY_RANGE, HistoryRange, HistoryPoint,
} from '../api/stocks.api';
import { useStockOverview } from '../hooks/useStockOverview';
import MainLayout from '../components/MainLayout';

export default function HistoriquePage({ user }: { user: User }) {
  const { t } = useTranslation();
  const role = parseAppRole(user.role?.label);
  const { lots: allLots, loading: lotsLoading } = useStockOverview();
  const lots = useMemo(() => visibleLotsFor(role, allLots), [role, allLots]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [historyRange, setHistoryRange] = useState<HistoryRange>(DEFAULT_HISTORY_RANGE);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!lots.some((l) => l.batchId === selectedId)) {
      setSelectedId(lots[0]?.batchId ?? '');
    }
  }, [lots, selectedId]);

  const selectedLot = lots.find((l) => l.batchId === selectedId) ?? null;

  useEffect(() => {
    if (!selectedLot) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    setHistoryLoading(true);
    fetchWarehouseHistory(selectedLot.warehouseId, historyRange)
      .then((points) => {
        if (!cancelled) setHistory(points);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedLot, historyRange]);

  return (
    <MainLayout user={user} title={t('historyPage.title')} navItems={STOCKS_NAV_ITEMS}>
      <div className="flex flex-col h-full gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-[#D8C5B1] p-4 flex flex-wrap items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('historyPage.lotLabel')}</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 min-w-[200px] p-2 border border-[#D8C5B1] rounded bg-white text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
          >
            {lots.map((l) => (
              <option key={l.batchId} value={l.batchId}>
                {l.displayId} — {l.countryRole ? t(`roles.${l.countryRole}`) : l.countryName}, {l.warehouseName}
              </option>
            ))}
          </select>

          <label className="text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{t('common.historyRange.label')}</label>
          <select
            value={historyRange}
            onChange={(e) => setHistoryRange(e.target.value as HistoryRange)}
            className="p-2 border border-[#D8C5B1] rounded bg-white text-sm text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
          >
            {HISTORY_RANGES.map((range) => (
              <option key={range} value={range}>{t(`common.historyRange.${range}`)}</option>
            ))}
          </select>
        </div>

        {lotsLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">{t('common.loadingData')}</div>
        ) : !selectedLot ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">{t('historyPage.noLots')}</div>
        ) : (
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-[#D8C5B1] p-6 flex flex-col gap-6 overflow-y-auto">
            <div>
              <h2 className="text-xl font-bold text-[#4A3022]">{selectedLot.displayId}</h2>
              <p className="text-sm text-gray-500">
                {t('historyPage.storedOn')} {formatStoredDate(selectedLot.storedAt)} — {selectedLot.warehouseName}, {selectedLot.countryRole ? t(`roles.${selectedLot.countryRole}`) : selectedLot.countryName}
              </p>
            </div>

            {historyLoading ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">{t('common.loadingData')}</div>
            ) : (
              <>
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4">{t('historyPage.temperature')}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#8C6239" interval={Math.ceil(history.length / 10)} />
                      <YAxis tick={{ fontSize: 12 }} stroke="#8C6239" domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="temperature" stroke="#8C6239" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-4">{t('historyPage.humidity')}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#8C6239" interval={Math.ceil(history.length / 10)} />
                      <YAxis tick={{ fontSize: 12 }} stroke="#8C6239" domain={['auto', 'auto']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="humidite" stroke="#2563EB" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
