import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { parseAppRole } from '../constants/roles.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import { visibleCountriesFor, flattenLots, parseStoredDate } from '../data/stocks.data';
import MainLayout from '../components/MainLayout';

type SortKey = 'date' | 'status' | 'id';

export default function StocksPage({ user }: { user: User }) {
  const { t } = useTranslation();
  const role = parseAppRole(user.role?.label);
  const lots = useMemo(() => flattenLots(visibleCountriesFor(role)), [role]);
  const [sortKey, setSortKey] = useState<SortKey>('date');

  const sortedLots = useMemo(() => {
    const copy = [...lots];
    copy.sort((a, b) => {
      if (sortKey === 'date') {
        // FIFO : lot le plus ancien en premier (cf. cahier des charges)
        return parseStoredDate(a.date).getTime() - parseStoredDate(b.date).getTime();
      }
      if (sortKey === 'status') {
        return (a.status === 'Alert' ? 0 : 1) - (b.status === 'Alert' ? 0 : 1);
      }
      return a.id.localeCompare(b.id);
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

        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EBDBC9] text-[#4A3022] text-sm uppercase tracking-wider">
                <th className="p-3 font-semibold">{t('stocksPage.colId')}</th>
                <th className="p-3 font-semibold">{t('stocksPage.colCountry')}</th>
                <th className="p-3 font-semibold">{t('stocksPage.colWarehouse')}</th>
                <th className="p-3 font-semibold">{t('stocksPage.colVariety')}</th>
                <th className="p-3 font-semibold">{t('stocksPage.colDate')}</th>
                <th className="p-3 font-semibold">{t('stocksPage.colStatus')}</th>
                <th className="p-3 font-semibold text-right">{t('stocksPage.colWeight')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8C5B1]">
              {sortedLots.map((lot) => (
                <tr key={lot.id} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="p-3 font-medium text-[#4A3022]">{lot.id}</td>
                  <td className="p-3 text-gray-600">{t(`roles.${lot.countryRole}`)}</td>
                  <td className="p-3 text-gray-600">{lot.warehouseName}</td>
                  <td className="p-3 text-gray-600">{lot.variety}</td>
                  <td className="p-3 text-gray-600">{lot.date}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      lot.status === 'Normal' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {lot.status === 'Normal' ? `✓ ${t('status.normal')}` : `⚠️ ${t('status.alert')}`}
                    </span>
                  </td>
                  <td className="p-3 text-right text-gray-600">{lot.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}