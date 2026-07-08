import { test, expect } from '@playwright/test';
import { TEST_USERS, login, logout } from './helpers';

test.describe('E2E-01 — Authentification', () => {

  test('E2E-01-A : accès sans cookie redirige vers /login', async ({ page }) => {
    await page.goto('/direction');
    await expect(page).toHaveURL('/login');
  });

  test('E2E-01-B : mauvais mot de passe → message d\'erreur, pas de redirection', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.admin.email);
    await page.fill('input[type="password"]', 'mauvais_mdp');
    await page.click('button[type="submit"]');

    // Regex pour matcher le message d'erreur dans toutes les langues
    await expect(page.getByText(/incorrect|Error|Incorrect|Cerrar|incorretos/i).first())
      .toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL('/login');
  });

  test('E2E-01-C : connexion admin redirige vers /admin', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page).toHaveURL('/admin');
    // Regex pour matcher le titre en FR et EN
    await expect(page.getByText(/Équipe FutureKawa|FutureKawa Team/i).first()).toBeVisible();
  });

  test('E2E-01-D : connexion direction redirige vers /direction', async ({ page }) => {
    await login(page, TEST_USERS.direction.email, TEST_USERS.direction.password);
    await expect(page).toHaveURL('/direction');
  });

  test('E2E-01-E : déconnexion efface la session', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await logout(page);
    await expect(page).toHaveURL('/login');
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

});