import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { parseAppRole } from '../constants/roles.constant';
import { STOCKS_NAV_ITEMS } from '../constants/nav.constant';
import { visibleCountriesFor, flattenLots } from '../data/stocks.data';
import MainLayout from '../components/MainLayout';

export default function AlertesPage({ user }: { user: User }) {
  const { t } = useTranslation();
  const role = parseAppRole(user.role?.label);
  const lots = useMemo(() => flattenLots(visibleCountriesFor(role)), [role]);
  const alerts = lots.filter((l) => l.status === 'Alert');

  return (
    <MainLayout user={user} title={t('alertsPage.title')} navItems={STOCKS_NAV_ITEMS}>
      <div className="flex flex-col gap-4 h-full overflow-y-auto">
        <p className="text-sm text-gray-500">
          {t('alertsPage.activeCount', { count: alerts.length })}
        </p>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-[#D8C5B1] p-8 text-center text-gray-400">
            {t('alertsPage.noAlerts')}
          </div>
        ) : (
          alerts.map((lot) => (
            <div
              key={lot.id}
              className="bg-white rounded-lg shadow-sm border border-[#D8C5B1] border-l-4 border-l-red-400 p-4 flex items-start justify-between gap-4"
            >
              <div>
                <h3 className="font-bold text-[#4A3022]">{lot.id} — {lot.variety}</h3>
                <p className="text-sm text-gray-500">
                  {lot.warehouseName}, {t(`roles.${lot.countryRole}`)} — {t('alertsPage.storedOn')} {lot.date}
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {lot.reasonKeys.map((key) => (
                    <li key={key}>{t(`alertReasons.${key}`, { days: 365 })}</li>
                  ))}
                </ul>
              </div>
              <div className="text-right text-xs text-gray-400 whitespace-nowrap">
                <div>🌡️ {lot.temp}°C</div>
                <div>💧 {lot.humidity}%</div>
              </div>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}