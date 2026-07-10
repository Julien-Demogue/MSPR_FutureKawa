import { Page } from '@playwright/test';

export const TEST_USERS = {
<<<<<<< HEAD
  admin: { email: 'admin@futurekawa.test', password: 'Admin1234!', role: 'ADMIN' },
  direction: { email: 'direction@futurekawa.test', password: 'Test1234!', role: 'DIRECTION' },
  brazil: { email: 'brazil@futurekawa.test', password: 'Test1234!', role: 'BRAZIL' },
=======
  admin:     { email: 'admin@futurekawa.test',     password: 'Admin1234!', role: 'ADMIN' },
  direction: { email: 'direction@futurekawa.test', password: 'Test1234!', role: 'DIRECTION' },
  brazil:    { email: 'brazil@futurekawa.test',    password: 'Test1234!', role: 'BRAZIL' },
>>>>>>> parent of a94d434 (Revert accidental merge to main)
} as const;

/** Se connecte et attend la redirection vers le dashboard */
export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Attendre la redirection — si ça timeout, le compte n'existe probablement pas en base
  await page.waitForURL(/\/(admin|direction)/, { timeout: 10_000 }).catch(() => {
    throw new Error(
      `Login échoué pour ${email}. ` +
      `Vérifiez que les comptes de test existent en base (lancez d'abord global-setup.ts ` +
      `ou exécutez le script SQL de seed).`
    );
  });
}

/** Se déconnecte depuis n'importe quelle page authentifiée */
export async function logout(page: Page) {
  // Chercher le bouton déconnexion dans n'importe quelle langue
  const logoutBtn = page.locator('button:has-text("Déconnexion"), button:has-text("Log out"), button:has-text("Sair"), button:has-text("Cerrar sesión")');
  await logoutBtn.first().click();
  await page.waitForURL('/login');
}

/** Ouvre la modale "Nouvel Utilisateur" et remplit le formulaire */
export async function fillCreateUserModal(
  page: Page,
  opts: { firstName: string; lastName: string; email: string; password: string; role: string }
) {
  const modal = page.locator('.fixed.inset-0');
  await modal.waitFor({ state: 'visible' });

  await modal.locator('input[type="text"]').first().fill(opts.firstName);
  await modal.locator('input[type="text"]').nth(1).fill(opts.lastName);
  await modal.locator('input[type="email"]').fill(opts.email);
  await modal.locator('input[type="password"]').fill(opts.password);
  await modal.locator('select').selectOption(opts.role);
}