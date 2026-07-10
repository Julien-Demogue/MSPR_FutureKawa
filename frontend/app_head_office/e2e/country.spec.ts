import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helpers';

test.describe('E2E-04 — Isolation par pays (BRAZIL)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.brazil.email, TEST_USERS.brazil.password);
    await expect(page).toHaveURL('/direction');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-04-A : sélecteur pays absent, champ pays en lecture seule', async ({ page }) => {
    // Pour un compte pays, le sélecteur Pays est remplacé par un <div> statique.
    // Aucune option <select> ne doit proposer les valeurs des autres pays.
    await expect(page.locator('select option[value="ECUADOR"]')).toHaveCount(0);
    await expect(page.locator('select option[value="COLOMBIA"]')).toHaveCount(0);

    // Le texte "Brésil" doit être visible comme libellé fixe
    await expect(page.getByText(/Brésil|Brazil/i).first()).toBeVisible();
  });

  test('E2E-04-B : lots affichés uniquement brésiliens', async ({ page }) => {
    // Chaque carte de lot porte un attribut data-country-role reflétant le pays réel du lot (API).
    const lotCards = page.locator('[data-country-role]');
    await expect(lotCards.first()).toBeVisible();
    const count = await lotCards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(lotCards.nth(i)).toHaveAttribute('data-country-role', 'BRAZIL');
    }
  });

  test('E2E-04-C : bannière d\'alertes cantonnée au Brésil', async ({ page }) => {
    const banner = page.locator('[class*="border-orange"]');
    const count = await banner.count();
    if (count > 0) {
      const text = await banner.textContent() ?? '';
      expect(text).not.toMatch(/ECU|COL/);
    }
  });

  test('E2E-04-D : page Stocks — uniquement lots brésiliens', async ({ page }) => {
    await page.goto('/direction/stocks');
    await page.waitForLoadState('networkidle');
    const countryCol = await page.locator('tbody tr td:nth-child(2)').allTextContents();
    expect(countryCol.length).toBeGreaterThan(0);
    expect(countryCol.every(c => /Brésil|Brazil/i.test(c))).toBeTruthy();
  });

  test('E2E-04-E : page Alertes — uniquement alertes brésiliennes', async ({ page }) => {
    await page.goto('/direction/alertes');
    await page.waitForLoadState('networkidle');
    const alertTexts = await page.locator('[class*="border-l-red"]').allTextContents();
    alertTexts.forEach(text => {
      expect(text).not.toMatch(/Équateur|Colombie|Ecuador|Colombia/);
    });
  });

});