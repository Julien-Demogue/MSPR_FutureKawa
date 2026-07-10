import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { AppRole, parseAppRole } from '../constants/roles.constant';
import { COUNTRY_NAME_BY_ROLE } from '../constants/countries.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import {
  visibleLotsFor, fetchWarehouseHistory, formatStoredDate, ComputedLot,
  HISTORY_RANGES, DEFAULT_HISTORY_RANGE, HistoryRange, HistoryPoint,
} from '../api/stocks.api';
import { useStockOverview } from '../hooks/useStockOverview';
import MainLayout from '../components/MainLayout';
import StatusBadge from '../components/StatusBadge';

const ALL = 'ALL' as const;
type CountryFilter = typeof ALL | AppRole;

export default function DirectionDashboard({ user }: { user: User }) {
  const { t } = useTranslation();
  const userRole = parseAppRole(user.role?.label);
  const lockedCountryRole = userRole && COUNTRY_NAME_BY_ROLE[userRole] ? userRole : null;

  const { lots: allLots, loading, error } = useStockOverview();
  const visibleLots = useMemo(() => visibleLotsFor(lockedCountryRole ?? userRole, allLots), [lockedCountryRole, userRole, allLots]);

  const [selectedCountry, setSelectedCountry] = useState<CountryFilter>(lockedCountryRole ?? ALL);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<typeof ALL | number>(ALL);
  const [historyRange, setHistoryRange] = useState<HistoryRange>(DEFAULT_HISTORY_RANGE);

  const countryOptions = useMemo(() => {
    const seen = new Map<AppRole, string>();
    visibleLots.forEach((l) => {
      if (l.countryRole) seen.set(l.countryRole, l.countryName);
    });
    return Array.from(seen.keys());
  }, [visibleLots]);

  const warehouseOptions = useMemo(() => {
    const scoped = selectedCountry === ALL ? visibleLots : visibleLots.filter((l) => l.countryRole === selectedCountry);
    const seen = new Map<number, { id: number; name: string; countryRole: AppRole | undefined }>();
    scoped.forEach((l) => seen.set(l.warehouseId, { id: l.warehouseId, name: l.warehouseName, countryRole: l.countryRole }));
    return Array.from(seen.values());
  }, [selectedCountry, visibleLots]);

  useEffect(() => {
    if (selectedWarehouseId !== ALL && !warehouseOptions.some((w) => w.id === selectedWarehouseId)) {
      setSelectedWarehouseId(ALL);
    }
  }, [warehouseOptions, selectedWarehouseId]);

  const filteredLots = useMemo(() => {
    const scoped = selectedCountry === ALL ? visibleLots : visibleLots.filter((l) => l.countryRole === selectedCountry);
    return selectedWarehouseId === ALL ? scoped : scoped.filter((l) => l.warehouseId === selectedWarehouseId);
  }, [selectedCountry, selectedWarehouseId, visibleLots]);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  useEffect(() => {
    if (!filteredLots.some((l) => l.batchId === selectedLotId)) {
      setSelectedLotId(filteredLots[0]?.batchId ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLots]);

  const selectedLot: ComputedLot | null = filteredLots.find((l) => l.batchId === selectedLotId) ?? null;

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const scopeLabel = useMemo(() => {
    if (selectedCountry === ALL) return t('overview.allCountriesLabel');
    const countryLabel = t(`roles.${selectedCountry}`);
    if (selectedWarehouseId === ALL) return countryLabel;
    const w = warehouseOptions.find((opt) => opt.id === selectedWarehouseId);
    return w ? `${w.name}, ${countryLabel}` : countryLabel;
  }, [selectedCountry, selectedWarehouseId, warehouseOptions, t]);

  const criticalLots = visibleLots.filter((l) => l.status === 'ALERT');

  if (loading) {
    return (
      <MainLayout user={user} title={t('overview.title')} navItems={STOCKS_NAV_ITEMS}>
        <div className="flex-1 flex items-center justify-center text-gray-400 h-full">{t('common.loadingData')}</div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout user={user} title={t('overview.title')} navItems={STOCKS_NAV_ITEMS}>
        <div className="flex-1 flex items-center justify-center text-red-500 h-full">{t('common.loadError')}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      user={user}
      title={lockedCountryRole ? t('overview.titleWithCountry', { country: t(`roles.${lockedCountryRole}`) }) : t('overview.title')}
      navItems={STOCKS_NAV_ITEMS}
    >
      <div className="flex flex-col h-full gap-4">

        {criticalLots.length > 0 && (
          <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded shadow-sm flex items-center gap-2 text-orange-800 text-sm font-medium">
            <span>⚠️</span>
            {t('overview.criticalBanner', { count: criticalLots.length })}{' '}
            {criticalLots.map((l) => `${l.displayId} (${l.warehouseName})`).join(', ')}
          </div>
        )}

        <div className="flex flex-1 gap-6 overflow-hidden h-full">

          <div className="w-1/3 flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('overview.country')}</label>
                {lockedCountryRole ? (
                  <div className="w-full p-2 border border-[#D8C5B1] rounded bg-[#FDFBF7] text-[#4A3022] font-medium">
                    {t(`roles.${lockedCountryRole}`)}
                  </div>
                ) : (
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value as CountryFilter)}
                    className="w-full p-2 border border-[#D8C5B1] rounded bg-white text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                  >
                    <option value={ALL}>{t('overview.allCountries')}</option>
                    {countryOptions.map((role) => (
                      <option key={role} value={role}>{t(`roles.${role}`)}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('overview.warehouse')}</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value === ALL ? ALL : Number(e.target.value))}
                  className="w-full p-2 border border-[#D8C5B1] rounded bg-white text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                >
                  <option value={ALL}>{t('overview.allWarehouses')}</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {selectedCountry === ALL && w.countryRole ? `${w.name} — ${t(`roles.${w.countryRole}`)}` : w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              <div className="text-sm text-gray-500 mb-2">
                {scopeLabel} — {t('overview.lotCount', { count: filteredLots.length })}
              </div>

              {filteredLots.length === 0 && (
                <div className="text-sm text-gray-400 italic">{t('overview.noLots')}</div>
              )}

              {filteredLots.map((lot) => (
                <button
                  key={lot.batchId}
                  data-country-role={lot.countryRole}
                  onClick={() => setSelectedLotId(lot.batchId)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLot?.batchId === lot.batchId
                      ? 'border-[#8C6239] bg-[#FDFBF7] shadow-md'
                      : 'border-transparent bg-white shadow-sm hover:border-[#D8C5B1]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[#4A3022]">{lot.displayId}</h3>
                      <p className="text-sm text-gray-500">{lot.warehouseName}</p>
                    </div>
                    <StatusBadge status={lot.status} />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-3">
                    <div className="flex gap-3">
                      <span>🌡️ {lot.temp ?? '—'}°C</span>
                      <span>💧 {lot.humidity ?? '—'}%</span>
                    </div>
                    <span>{t('overview.storedOn')} {formatStoredDate(lot.storedAt)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="w-2/3 bg-white rounded-lg shadow-sm border border-[#D8C5B1] p-6 flex flex-col overflow-y-auto">
            {!selectedLot ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                {t('overview.selectLotPrompt')}
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#4A3022]">{selectedLot.displayId}</h2>
                    <p className="text-gray-500">{selectedLot.warehouseName}</p>
                  </div>
                  <StatusBadge status={selectedLot.status} />
                </div>

                {selectedLot.alertReasons.length > 0 && (
                  <ul className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3 list-disc list-inside">
                    {selectedLot.alertReasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">🌡️ {t('overview.temperature')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.temp ?? '—'}°C</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">💧 {t('overview.humidity')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.humidity ?? '—'}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">📅 {t('overview.storedOn')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{formatStoredDate(selectedLot.storedAt)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mb-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase">{t('common.historyRange.label')}</label>
                  <select
                    value={historyRange}
                    onChange={(e) => setHistoryRange(e.target.value as HistoryRange)}
                    className="p-1.5 border border-[#D8C5B1] rounded bg-white text-sm text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                  >
                    {HISTORY_RANGES.map((range) => (
                      <option key={range} value={range}>{t(`common.historyRange.${range}`)}</option>
                    ))}
                  </select>
                </div>

                {historyLoading ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 min-h-[200px]">{t('common.loadingData')}</div>
                ) : (
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="flex-1 min-h-[200px] border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-4">{t('overview.temperatureChart')}</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8C6239" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#8C6239" domain={['auto', 'auto']} />
                          <Tooltip />
                          <Line type="monotone" dataKey="temperature" stroke="#8C6239" strokeWidth={2} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 min-h-[200px] border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-4">{t('overview.humidityChart')}</h3>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={history}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8C6239" />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="#2563EB"
                            domain={([min, max]: [number, number]) => [
                              Math.floor(min * 0.95),
                              Math.ceil(max * 1.05),
                            ]}
                          />
                          <Tooltip />
                          <Line type="monotone" dataKey="humidite" stroke="#2563EB" strokeWidth={2} dot={false} connectNulls />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}