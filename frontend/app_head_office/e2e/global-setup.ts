/**
 * global-setup.ts
 * Exécuté UNE FOIS avant tous les tests Playwright.
 * Crée les 3 comptes de test s'ils n'existent pas déjà.
 *
 * ⚠️  Renseignez vos vraies credentials admin ci-dessous
 *     (le compte qui existe déjà dans votre base FutureKawa).
 */

import axios, { AxiosInstance } from 'axios';

const BASE_URL = 'http://host.docker.internal:3001';

// ─── À MODIFIER avec vos credentials admin réels ───────────────────────────
const EXISTING_ADMIN_EMAIL    = 'admintest3@email.com';
const EXISTING_ADMIN_PASSWORD = 'admin';
// ───────────────────────────────────────────────────────────────────────────

const TEST_ACCOUNTS = [
  { first_name: 'Admin',     last_name: 'Test', email: 'admin@futurekawa.test',     password: 'Test1234!', role_label: 'ADMIN' },
  { first_name: 'Direction', last_name: 'Test', email: 'direction@futurekawa.test', password: 'Test1234!', role_label: 'DIRECTION' },
  { first_name: 'Brazil',    last_name: 'Test', email: 'brazil@futurekawa.test',    password: 'Test1234!', role_label: 'BRAZIL' },
];

export default async function globalSetup() {
  const api: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    validateStatus: () => true, // ne pas lever d'exception sur les 4xx
  });

  // 1. Connexion avec le compte admin existant pour obtenir le cookie
  console.log('\n[setup] Connexion avec le compte admin existant...');
  const loginRes = await api.post('/auth/login', {
    email: EXISTING_ADMIN_EMAIL,
    password: EXISTING_ADMIN_PASSWORD,
  });

  if (loginRes.status !== 200 && loginRes.status !== 201) {
    throw new Error(
      `[setup] Connexion admin échouée (${loginRes.status}). ` +
      `Vérifiez EXISTING_ADMIN_EMAIL et EXISTING_ADMIN_PASSWORD dans global-setup.ts`
    );
  }

  // Récupérer le cookie de session
  const cookie = loginRes.headers['set-cookie']?.[0] ?? '';
  api.defaults.headers.Cookie = cookie;
  console.log('[setup] Connecté ✓');

  // 2. Créer les comptes de test s'ils n'existent pas
  for (const account of TEST_ACCOUNTS) {
    const checkRes = await api.get(`/users/email?email=${account.email}`);

    if (checkRes.status === 200) {
      console.log(`[setup] ${account.email} existe déjà, on passe.`);
      continue;
    }

    const createRes = await api.post('/users', account);
    if (createRes.status === 201) {
      console.log(`[setup] ${account.email} créé ✓`);
    } else {
      console.warn(`[setup] Impossible de créer ${account.email} :`, createRes.data);
    }
  }

  // 3. Déconnexion propre
  await api.post('/auth/logout');
  console.log('[setup] Setup terminé.\n');
}