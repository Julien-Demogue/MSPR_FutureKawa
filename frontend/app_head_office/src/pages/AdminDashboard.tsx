import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, CreateUserPayload } from '../types/user.types';
import { AppRole } from '../constants/roles.constant';
import { ADMIN_NAV_ITEMS } from '../constants/nav.constant';
import MainLayout from '../components/MainLayout';
import { headOfficeApi } from '../api/axios.config';
import axios from 'axios';

const ROLE_OPTIONS = Object.values(AppRole);

const EMPTY_NEW_USER: CreateUserPayload = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role_label: '',
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    const msg = err.response.data.message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return fallback;
}

export default function AdminDashboard({ user: currentUser }: { user: User }) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserPayload>(EMPTY_NEW_USER);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await headOfficeApi.get<User[]>('/users');
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError(extractErrorMessage(err, t('admin.loadError')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.role_label) {
      setFormError(t('admin.roleRequired'));
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await headOfficeApi.post('/users', newUser);
      setIsModalOpen(false);
      setNewUser(EMPTY_NEW_USER);
      fetchUsers();
    } catch (err) {
      setFormError(extractErrorMessage(err, t('admin.createError')));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (uuid: string) => {
    if (window.confirm(t('admin.deleteConfirm'))) {
      try {
        await headOfficeApi.delete(`/users?uuid=${uuid}`);
        fetchUsers();
      } catch (err) {
        alert(extractErrorMessage(err, t('admin.deleteError')));
      }
    }
  };

  const handleRoleChange = async (uuid: string, newRole: string) => {
    try {
      await headOfficeApi.patch(`/users?uuid=${uuid}`, { role_label: newRole });
      fetchUsers();
    } catch (err) {
      alert(extractErrorMessage(err, t('admin.roleUpdateError')));
    }
  };

  return (
    <MainLayout user={currentUser} title={t('admin.title')} navItems={ADMIN_NAV_ITEMS}>
      <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-[#D8C5B1] overflow-hidden">

        <div className="p-6 border-b border-[#D8C5B1] flex justify-between items-center bg-[#FDFBF7]">
          <div>
            <h3 className="text-lg font-bold text-[#4A3022]">{t('admin.teamTitle')}</h3>
            <p className="text-sm text-gray-500">{t('admin.teamSubtitle')}</p>
          </div>
          <button
            onClick={() => { setFormError(''); setIsModalOpen(true); }}
            className="px-4 py-2 bg-[#8C6239] text-white rounded hover:bg-[#634533] transition-colors font-medium shadow-sm"
          >
            {t('admin.newUser')}
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 border-b border-red-100">{error}</div>}
        {loading && <div className="p-8 text-center text-gray-500">{t('admin.loadingUsers')}</div>}

        {!loading && !error && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EBDBC9] text-[#4A3022] text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">{t('admin.colName')}</th>
                  <th className="p-4 font-semibold">{t('admin.colEmail')}</th>
                  <th className="p-4 font-semibold">{t('admin.colRole')}</th>
                  <th className="p-4 font-semibold text-right">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8C5B1]">
                {users.map((u) => {
                  const currentRole = u.role?.label?.toUpperCase() ?? '';
                  const isSelf = u.uuid === currentUser?.uuid;

                  return (
                    <tr key={u.uuid} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="p-4 font-medium text-[#4A3022]">
                        {u.first_name} {u.last_name}
                        {isSelf && <span className="ml-2 text-xs bg-[#EBDBC9] text-[#4A3022] px-2 py-1 rounded-full">{t('common.you')}</span>}
                      </td>
                      <td className="p-4 text-gray-600">{u.email}</td>
                      <td className="p-4">
                        <select
                          value={currentRole}
                          onChange={(e) => handleRoleChange(u.uuid, e.target.value)}
                          disabled={isSelf}
                          className="p-1.5 border border-[#D8C5B1] rounded bg-white text-sm focus:ring-[#8C6239] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {!ROLE_OPTIONS.includes(currentRole as AppRole) && currentRole && (
                            <option value={currentRole}>{currentRole} {t('admin.unknownRoleSuffix')}</option>
                          )}
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{t(`roles.${role}`)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDelete(u.uuid)}
                          disabled={isSelf}
                          className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed font-medium text-sm"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-[#D8C5B1] bg-[#FDFBF7]">
              <h2 className="text-xl font-bold text-[#4A3022]">{t('admin.modalTitle')}</h2>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.firstName')}</label>
                  <input required type="text" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} className="w-full p-2 border border-[#D8C5B1] rounded" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.lastName')}</label>
                  <input required type="text" value={newUser.last_name} onChange={e => setNewUser({ ...newUser, last_name: e.target.value })} className="w-full p-2 border border-[#D8C5B1] rounded" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.email')}</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="w-full p-2 border border-[#D8C5B1] rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.tempPassword')}</label>
                <input required type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} className="w-full p-2 border border-[#D8C5B1] rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.initialRole')}</label>
                <select
                  required
                  value={newUser.role_label}
                  onChange={e => setNewUser({ ...newUser, role_label: e.target.value })}
                  className="w-full p-2 border border-[#D8C5B1] rounded"
                >
                  <option value="" disabled>{t('common.selectPlaceholder')}</option>
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>{t(`roles.${role}`)}</option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{formError}</div>
              )}

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#8C6239] text-white rounded hover:bg-[#634533] disabled:opacity-50">
                  {isSubmitting ? t('admin.creating') : t('admin.createAccount')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}