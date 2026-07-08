import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { parseAppRole } from '../constants/roles.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import { visibleLotsFor, formatStoredDate } from '../api/stocks.api';
import { useStockOverview } from '../hooks/useStockOverview';
import MainLayout from '../components/MainLayout';
import StatusBadge from '../components/StatusBadge';

type SortKey = 'date' | 'status' | 'id';

export default function StocksPage({ user }: { user: User }) {
  const { t } = useTranslation();
  const role = parseAppRole(user.role?.label);
  const { lots: allLots, loading, error } = useStockOverview();
  const lots = useMemo(() => visibleLotsFor(role, allLots), [role, allLots]);
  const [sortKey, setSortKey] = useState<SortKey>('date');

  const sortedLots = useMemo(() => {
    const copy = [...lots];
    copy.sort((a, b) => {
      if (sortKey === 'date') {
        // FIFO : lot le plus ancien en premier (cf. cahier des charges)
        return a.storedAt.getTime() - b.storedAt.getTime();
      }
      if (sortKey === 'status') {
        return (a.status === 'ALERT' ? 0 : 1) - (b.status === 'ALERT' ? 0 : 1);
      }
      return a.id - b.id;
    });
    return copy;
  }, [lots, sortKey]);

  return (
    <MainLayout user={user} title={t('stocksPage.title')} navItems={STOCKS_NAV_ITEMS}>
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-[#D8C5B1] overflow-hidden">
        <div className="p-6 border-b border-[#D8C5B1] flex justify-between items-center bg-[#FDFBF7]">
          <div>
            <h3 className="text-lg font-bold text-[#4A3022]">{t('stocksPage.allLots')}</h3>
            <p className="text-sm text-gray-500">{t('stocksPage.lotCount', { count: sortedLots.length })}</p>
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="p-2 border border-[#D8C5B1] rounded bg-white text-sm text-[#4A3022] focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
          >
            <option value="date">{t('stocksPage.sortByDate')}</option>
            <option value="status">{t('stocksPage.sortByStatus')}</option>
            <option value="id">{t('stocksPage.sortById')}</option>
          </select>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">{t('common.loadingData')}</div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-500">{t('common.loadError')}</div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EBDBC9] text-[#4A3022] text-sm uppercase tracking-wider">
                  <th className="p-3 font-semibold">{t('stocksPage.colId')}</th>
                  <th className="p-3 font-semibold">{t('stocksPage.colCountry')}</th>
                  <th className="p-3 font-semibold">{t('stocksPage.colWarehouse')}</th>
                  <th className="p-3 font-semibold">{t('stocksPage.colDate')}</th>
                  <th className="p-3 font-semibold">{t('stocksPage.colStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8C5B1]">
                {sortedLots.map((lot) => (
                  <tr key={lot.batchId} className="hover:bg-[#FDFBF7] transition-colors" data-country-role={lot.countryRole}>
                    <td className="p-3 font-medium text-[#4A3022]">{lot.displayId}</td>
                    <td className="p-3 text-gray-600">{lot.countryRole ? t(`roles.${lot.countryRole}`) : lot.countryName}</td>
                    <td className="p-3 text-gray-600">{lot.warehouseName}</td>
                    <td className="p-3 text-gray-600">{formatStoredDate(lot.storedAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={lot.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
