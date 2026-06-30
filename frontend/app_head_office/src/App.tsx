import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { headOfficeApi } from './api/axios.config';
import { User } from './types/user.types';
import { AppRole, COUNTRY_ROLES, parseAppRole } from './constants/roles.constant';
import LoginPage from './pages/LoginPage';
import DirectionDashboard from './pages/DirectionDashboard';
import StocksPage from './pages/StocksPage';
import HistoriquePage from './pages/HistoriquePage';
import AlertesPage from './pages/AlertesPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    headOfficeApi.get('/users/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <p className="text-[#4A3022] font-medium">{t('common.loading')}</p>
      </div>
    );
  }

  const role = parseAppRole(user?.role?.label);
  const isAdmin = role === AppRole.ADMIN;

  // Direction et les rôles pays (Brésil/Équateur/Colombie) partagent les mêmes pages
  // (Vue d'ensemble, Stocks, Historique, Alertes) : chaque page se charge elle-même
  // de filtrer aux données du pays pour les rôles pays.
  const canViewStocksPages = role === AppRole.DIRECTION || (role !== undefined && COUNTRY_ROLES.includes(role));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage onLogin={setUser} />} />

        <Route path="/admin" element={isAdmin ? <AdminDashboard user={user!} /> : <Navigate to="/login" />} />

        <Route path="/direction" element={canViewStocksPages ? <DirectionDashboard user={user!} /> : <Navigate to="/login" />} />
        <Route path="/direction/stocks" element={canViewStocksPages ? <StocksPage user={user!} /> : <Navigate to="/login" />} />
        <Route path="/direction/historique" element={canViewStocksPages ? <HistoriquePage user={user!} /> : <Navigate to="/login" />} />
        <Route path="/direction/alertes" element={canViewStocksPages ? <AlertesPage user={user!} /> : <Navigate to="/login" />} />

        <Route path="/" element={user ? <DashboardRedirect role={role} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

function DashboardRedirect({ role }: { role: AppRole | undefined }) {
  const { t } = useTranslation();
  if (role === AppRole.ADMIN) return <Navigate to="/admin" />;
  if (role === AppRole.DIRECTION || (role !== undefined && COUNTRY_ROLES.includes(role))) {
    return <Navigate to="/direction" />;
  }
  return <div className="p-8 text-center text-red-800">{t('common.unknownRole')}</div>;
}

export default App;