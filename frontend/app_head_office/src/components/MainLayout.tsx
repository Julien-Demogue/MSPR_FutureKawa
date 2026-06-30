import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User } from '../types/user.types';
import { headOfficeApi } from '../api/axios.config';
import LanguageSwitcher from './LanguageSwitcher';

export interface NavItem {
  labelKey: string;
  path: string;
  /** Si true, le lien n'est actif que sur une correspondance exacte (utile pour la racine du dashboard) */
  end?: boolean;
}

interface MainLayoutProps {
  children: ReactNode;
  user: User | null;
  title?: string;
  navItems?: NavItem[];
}

export default function MainLayout({ children, user, title, navItems = [] }: MainLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-[#FDFBF7] font-sans">
      {/* Barre latérale */}
      <aside className="w-64 bg-[#4A3022] text-white flex flex-col">
        <div className="h-16 flex items-center justify-center border-b border-[#634533] bg-[#FDFBF7]">
          <h1 className="text-xl font-bold tracking-wider text-[#4A3022] flex items-center gap-2">
            <span className="text-[#8C6239]">☕</span> {t('common.appName')}
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `block w-full text-left px-4 py-2 rounded transition-colors ${
                  isActive ? 'bg-[#634533] text-white font-medium' : 'hover:bg-[#634533] text-gray-300'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* En-tête */}
        <header className="h-16 bg-[#EBDBC9] flex items-center justify-between px-6 border-b border-[#D8C5B1]">
          <h2 className="text-xl font-semibold text-[#4A3022]">{title}</h2>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-right flex flex-col items-end">
              <div className="text-[#4A3022] font-medium text-sm">
                {user ? `${user.first_name} ${user.last_name}` : t('common.user')}
              </div>
              <button
                onClick={async () => {
                  try {
                    await headOfficeApi.post('/auth/logout');
                  } catch (e) {
                    console.error(e);
                  }
                  window.location.href = '/login';
                }}
                className="text-red-600 text-xs font-bold hover:underline cursor-pointer"
              >
                {t('common.logout')}
              </button>
            </div>
            <div className="h-10 w-10 bg-[#4A3022] rounded-full flex items-center justify-center text-white font-bold shadow-inner">
              {user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Contenu dynamique */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}