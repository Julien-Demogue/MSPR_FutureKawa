import { useMemo, useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { AppRole, parseAppRole } from '../constants/roles.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import {
  visibleCountriesFor, generateHistory, IDEAL_CONDITIONS, computeLotStatus,
  HISTORY_RANGES, DEFAULT_HISTORY_RANGE, HistoryRange,
} from '../data/stocks.data';
import MainLayout from '../components/MainLayout';

const ALL = 'ALL' as const;
type CountryFilter = typeof ALL | AppRole;

export default function DirectionDashboard({ user }: { user: User }) {
  const { t } = useTranslation();
  const userRole = parseAppRole(user.role?.label);
  // Un compte pays (BRAZIL/ECUADOR/COLOMBIA) est verrouillé sur son propre pays :
  // pas de sélecteur de pays, et tout (alertes incluses) reste scopé à ce pays.
  const lockedCountryRole = userRole && IDEAL_CONDITIONS[userRole] ? userRole : null;

  const visibleCountries = useMemo(() => visibleCountriesFor(lockedCountryRole ?? userRole), [lockedCountryRole, userRole]);

  const [selectedCountry, setSelectedCountry] = useState<CountryFilter>(lockedCountryRole ?? ALL);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<typeof ALL | string>(ALL);
  const [historyRange, setHistoryRange] = useState<HistoryRange>(DEFAULT_HISTORY_RANGE);

  const warehouseOptions = useMemo(() => {
    const countries = selectedCountry === ALL ? visibleCountries : visibleCountries.filter((c) => c.role === selectedCountry);
    return countries.flatMap((c) => c.warehouses.map((w) => ({ id: w.id, name: w.name, countryRole: c.role })));
  }, [selectedCountry, visibleCountries]);

  useEffect(() => {
    if (selectedWarehouseId !== ALL && !warehouseOptions.some((w) => w.id === selectedWarehouseId)) {
      setSelectedWarehouseId(ALL);
    }
  }, [warehouseOptions, selectedWarehouseId]);

  const filteredLots = useMemo(() => {
    const countries = selectedCountry === ALL ? visibleCountries : visibleCountries.filter((c) => c.role === selectedCountry);
    const warehouses = countries.flatMap((c) => c.warehouses.map((w) => ({ ...w, countryRole: c.role })));
    const scoped = selectedWarehouseId === ALL ? warehouses : warehouses.filter((w) => w.id === selectedWarehouseId);

    return scoped.flatMap((w) =>
      w.lots.map((lot) => {
        const { status, reasonKeys } = computeLotStatus(w.countryRole, lot);
        return { ...lot, status, reasonKeys, warehouseName: w.name, countryRole: w.countryRole };
      }),
    );
  }, [selectedCountry, selectedWarehouseId, visibleCountries]);

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);

  useEffect(() => {
    if (!filteredLots.some((l) => l.id === selectedLotId)) {
      setSelectedLotId(filteredLots[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredLots]);

  const selectedLot = filteredLots.find((l) => l.id === selectedLotId) ?? null;
  const history = useMemo(
    () => (selectedLot ? generateHistory(selectedLot.temp, selectedLot.humidity, historyRange) : []),
    [selectedLot, historyRange],
  );

  const scopeLabel = useMemo(() => {
    if (selectedCountry === ALL) return t('overview.allCountriesLabel');
    const countryLabel = t(`roles.${selectedCountry}`);
    if (selectedWarehouseId === ALL) return countryLabel;
    const w = warehouseOptions.find((opt) => opt.id === selectedWarehouseId);
    return w ? `${w.name}, ${countryLabel}` : countryLabel;
  }, [selectedCountry, selectedWarehouseId, warehouseOptions, t]);

  const alertScopeLots = useMemo(
    () =>
      visibleCountries.flatMap((c) =>
        c.warehouses.flatMap((w) =>
          w.lots.map((lot) => ({ ...lot, ...computeLotStatus(c.role, lot), warehouseName: w.name })),
        ),
      ),
    [visibleCountries],
  );
  const criticalLots = alertScopeLots.filter((l) => l.status === 'Alert');

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
            {criticalLots.map((l) => `${l.id} (${l.warehouseName})`).join(', ')}
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
                    {visibleCountries.map((c) => (
                      <option key={c.role} value={c.role}>{t(`roles.${c.role}`)}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{t('overview.warehouse')}</label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full p-2 border border-[#D8C5B1] rounded bg-white text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                >
                  <option value={ALL}>{t('overview.allWarehouses')}</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>
                      {selectedCountry === ALL ? `${w.name} — ${t(`roles.${w.countryRole}`)}` : w.name}
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
                  key={lot.id}
                  onClick={() => setSelectedLotId(lot.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedLot?.id === lot.id
                      ? 'border-[#8C6239] bg-[#FDFBF7] shadow-md'
                      : 'border-transparent bg-white shadow-sm hover:border-[#D8C5B1]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-[#4A3022]">{lot.id}</h3>
                      <p className="text-sm text-gray-500">{lot.variety} - {lot.weight} kg</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lot.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {lot.status === 'Normal' ? `✓ ${t('status.normal')}` : `⚠️ ${t('status.alert')}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-3">
                    <div className="flex gap-3">
                      <span>🌡️ {lot.temp}°C</span>
                      <span>💧 {lot.humidity}%</span>
                    </div>
                    <span>{t('overview.storedOn')} {lot.date}</span>
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
                    <h2 className="text-2xl font-bold text-[#4A3022]">{selectedLot.id}</h2>
                    <p className="text-gray-500">{selectedLot.variety} — {selectedLot.warehouseName}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedLot.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedLot.status === 'Normal' ? `✓ ${t('status.normal')}` : `⚠️ ${t('status.alert')}`}
                  </span>
                </div>

                {selectedLot.reasonKeys.length > 0 && (
                  <ul className="mb-6 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-3 list-disc list-inside">
                    {selectedLot.reasonKeys.map((key) => (
                      <li key={key}>{t(`alertReasons.${key}`, { days: 365 })}</li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">🌡️ {t('overview.temperature')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.temp}°C</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">💧 {t('overview.humidity')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.humidity}%</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">📦 {t('overview.weight')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.weight} kg</p>
                  </div>
                  <div className="p-4 rounded-lg bg-[#FDFBF7] border border-[#EBDBC9]">
                    <p className="text-sm text-gray-500 mb-1">📅 {t('overview.storedOn')}</p>
                    <p className="text-xl font-bold text-[#4A3022]">{selectedLot.date}</p>
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

                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex-1 min-h-[200px] border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">{t('overview.temperatureChart')}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8C6239" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#8C6239" domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="temperature" stroke="#8C6239" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex-1 min-h-[200px] border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">{t('overview.humidityChart')}</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={history}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EBDBC9" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#8C6239" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#8C6239" domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="humidite" stroke="#2563EB" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}