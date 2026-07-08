import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helpers';

test.describe('E2E-05 — Internationalisation', () => {

  test.beforeEach(async ({ page }) => {
    // Repartir du français à chaque test pour avoir un état connu
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("FR")');
  });

  test('E2E-05-A : changement vers l\'anglais sur la page login', async ({ page }) => {
    await page.click('button:has-text("EN")');
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in');
    await expect(page.locator('label').first()).toContainText('Email address');
  });

  test('E2E-05-B : changement vers l\'espagnol sur la page login', async ({ page }) => {
    await page.click('button:has-text("ES")');
    await expect(page.locator('button[type="submit"]')).toHaveText('Iniciar sesión');
    await expect(page.locator('label').first()).toContainText('Correo electrónico');
  });

  test('E2E-05-C : changement vers le portugais sur la page login', async ({ page }) => {
    await page.click('button:has-text("PT")');
    await expect(page.locator('button[type="submit"]')).toHaveText('Entrar');
    await expect(page.locator('label').first()).toContainText('Endereço de e-mail');
  });

  test('E2E-05-D : langue persistée entre les pages (EN)', async ({ page }) => {
    await page.click('button:has-text("EN")');
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

    // Après login et redirection, l'interface reste en anglais
    await expect(page.locator('h3').first()).toContainText('FutureKawa Team');
  });

  test('E2E-05-E : langue persistée après rechargement (ES)', async ({ page }) => {
    await login(page, TEST_USERS.direction.email, TEST_USERS.direction.password);
    await expect(page).toHaveURL('/direction');

    await page.click('button:has-text("ES")');
    await expect(page.locator('nav')).toContainText('Existencias');

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('nav')).toContainText('Existencias');
  });

  test('E2E-05-F : retour au français', async ({ page }) => {
    await page.click('button:has-text("EN")');
    await expect(page.locator('button[type="submit"]')).toHaveText('Sign in');

    await page.click('button:has-text("FR")');
    await expect(page.locator('button[type="submit"]')).toHaveText('Se connecter');
  });

});