import { useTranslation } from 'react-i18next';
import { StatusValue } from '../api/stocks.api';

const STATUS_CLASSES: Record<StatusValue, string> = {
  OK: 'bg-green-100 text-green-700',
  ALERT: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-200 text-gray-600',
  DESTROYED: 'bg-gray-200 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
};

const STATUS_ICONS: Record<StatusValue, string> = {
  OK: '✓',
  ALERT: '⚠️',
  EXPIRED: '⏳',
  DESTROYED: '🗑️',
  SENT: '📦',
};

export default function StatusBadge({ status }: { status: StatusValue | null }) {
  const { t } = useTranslation();
  if (!status) return null;

  return (
    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_CLASSES[status]}`}>
      {STATUS_ICONS[status]} {t(`status.${status}`)}
    </span>
  );
}
