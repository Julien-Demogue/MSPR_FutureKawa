import type { NavItem } from '../components/MainLayout';

/** Menu utilisé par Direction et les comptes pays (Brésil/Équateur/Colombie) */
export const STOCKS_NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.overview', path: '/direction', end: true },
  { labelKey: 'nav.stocks', path: '/direction/stocks' },
  { labelKey: 'nav.history', path: '/direction/historique' },
  { labelKey: 'nav.alerts', path: '/direction/alertes' },
];

/** Menu utilisé par le dashboard Admin */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { labelKey: 'nav.users', path: '/admin', end: true },
];