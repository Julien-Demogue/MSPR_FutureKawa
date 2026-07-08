import { test, expect } from '@playwright/test';
import { TEST_USERS, login, fillCreateUserModal } from './helpers';

test.describe('E2E-02 — Dashboard Admin', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page).toHaveURL('/admin');
  });

  test('E2E-02-A : création d\'un utilisateur BRAZIL', async ({ page }) => {
    const email = `e2e-${Date.now()}@futurekawa.test`;

    await page.click('button:has-text("Nouvel Utilisateur"), button:has-text("New User")');
    await fillCreateUserModal(page, {
      firstName: 'Test',
      lastName:  'E2E',
      email,
      password:  'Test1234!',
      role:      'BRAZIL',
    });
    await page.locator('.fixed.inset-0').locator('button[type="submit"]').click();

    await expect(page.locator('.fixed.inset-0')).not.toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`td:has-text("${email}")`)).toBeVisible();
  });

  test('E2E-02-B : email déjà utilisé → erreur dans la modale', async ({ page }) => {
    await page.click('button:has-text("Nouvel Utilisateur"), button:has-text("New User")');
    await fillCreateUserModal(page, {
      firstName: 'Doublon',
      lastName:  'Test',
      email:     TEST_USERS.admin.email,
      password:  'Test1234!',
      role:      'ADMIN',
    });
    await page.locator('.fixed.inset-0').locator('button[type="submit"]').click();

    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    await expect(page.locator('.fixed.inset-0 .bg-red-50')).toBeVisible();
  });

  test('E2E-02-C : modification de rôle persiste après rechargement', async ({ page }) => {
    const email = TEST_USERS.direction.email;

    // Écouter la réponse PATCH avant de la déclencher
    let patchResponseBody: any = null;
    const patchDone = page.waitForResponse(
      res => res.url().includes('/users') && res.request().method() === 'PATCH',
      { timeout: 10_000 }
    );

    await page.locator(`tr:has(td:has-text("${email}"))`).locator('select').selectOption('COLOMBIA');

    const patchRes = await patchDone;
    patchResponseBody = await patchRes.json().catch(() => null);
    console.log('[E2E-02-C] PATCH status:', patchRes.status(), 'body:', JSON.stringify(patchResponseBody));
    expect(patchRes.status()).toBe(200);

    // Attendre que la liste soit rechargée (fetchUsers après PATCH)
    // toHaveValue fait des retries → attend que React ait mis à jour l'UI
    await expect(
      page.locator(`tr:has(td:has-text("${email}"))`).locator('select')
    ).toHaveValue('COLOMBIA', { timeout: 10_000 });

    // Recharger et attendre la réponse GET /users de l'AdminDashboard
    const getUsersDone = page.waitForResponse(
      res => {
        const url = res.url();
        return res.request().method() === 'GET'
          && url.includes('/users')
          && !url.includes('/users/me')
          && !url.includes('/users/email')
          && !url.includes('/users/uuid');
      },
      { timeout: 15_000 }
    );
    await page.reload();
    const getUsersRes = await getUsersDone;
    const usersData = await getUsersRes.json().catch(() => []);
    const directionUser = usersData.find((u: any) => u.email === email);
    console.log('[E2E-02-C] Rôle direction après rechargement:', directionUser?.role?.label);

    const rowAfter = page.locator(`tr:has(td:has-text("${email}"))`);
    await rowAfter.waitFor({ state: 'visible', timeout: 10_000 });
    await expect(rowAfter.locator('select')).toHaveValue('COLOMBIA', { timeout: 10_000 });

    // Remettre le rôle d'origine
    const resetDone = page.waitForResponse(
      res => res.url().includes('/users') && res.request().method() === 'PATCH',
      { timeout: 10_000 }
    );
    await rowAfter.locator('select').selectOption('DIRECTION');
    await resetDone;
  });

  test('E2E-02-D : suppression d\'un utilisateur (soft delete)', async ({ page }) => {
    const tempEmail = `delete-${Date.now()}@futurekawa.test`;
    await page.click('button:has-text("Nouvel Utilisateur"), button:has-text("New User")');
    await fillCreateUserModal(page, {
      firstName: 'Delete',
      lastName:  'Me',
      email:     tempEmail,
      password:  'Test1234!',
      role:      'ECUADOR',
    });
    await page.locator('.fixed.inset-0').locator('button[type="submit"]').click();
    await expect(page.locator(`td:has-text("${tempEmail}")`)).toBeVisible();

    page.on('dialog', dialog => dialog.accept());
    const row = page.locator(`tr:has(td:has-text("${tempEmail}"))`);
    await row.locator('button:has-text("Supprimer"), button:has-text("Delete")').click();

    await expect(page.locator(`td:has-text("${tempEmail}")`)).not.toBeVisible({ timeout: 5_000 });
  });

  test('E2E-02-E : l\'admin ne peut pas modifier son propre compte', async ({ page }) => {
    const row = page.locator(`tr:has(td:has-text("${TEST_USERS.admin.email}"))`);
    await expect(row.locator('select')).toBeDisabled();
    await expect(row.locator('button:has-text("Supprimer"), button:has-text("Delete")')).toBeDisabled();
  });

  test('E2E-02-F : rôle vide → modale reste ouverte sans soumission', async ({ page }) => {
    await page.click('button:has-text("Nouvel Utilisateur"), button:has-text("New User")');

    const modal = page.locator('.fixed.inset-0');
    await modal.locator('input[type="text"]').first().fill('Sans');
    await modal.locator('input[type="text"]').nth(1).fill('Role');
    await modal.locator('input[type="email"]').fill('sansr@futurekawa.test');
    await modal.locator('input[type="password"]').fill('Test1234!');

    await modal.locator('button[type="submit"]').click();
    await expect(modal).toBeVisible();
    await expect(modal.locator('select')).toHaveValue('');
  });

});