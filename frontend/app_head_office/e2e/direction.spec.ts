import { test, expect } from '@playwright/test';
import { TEST_USERS, login } from './helpers';

test.describe('E2E-03 — Dashboard Direction', () => {

  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.direction.email, TEST_USERS.direction.password);
    await expect(page).toHaveURL('/direction');
    await page.waitForLoadState('networkidle');
  });

  test('E2E-03-A : filtre pays → filtre entrepôt se met à jour', async ({ page }) => {
    const countrySelect = page.locator('select').first();
    const warehouseSelect = page.locator('select').nth(1);

    await countrySelect.selectOption('BRAZIL');
    const brazilOptions = await warehouseSelect.locator('option').allTextContents();

    await countrySelect.selectOption('ECUADOR');
    const ecuadorOptions = await warehouseSelect.locator('option').allTextContents();

    // La liste d'entrepôts proposée dépend du pays sélectionné : elle doit changer
    // (les entrepôts réels viennent de l'API, on ne connaît pas leurs noms à l'avance).
    expect(brazilOptions).not.toEqual(ecuadorOptions);
  });

  test('E2E-03-B : changer de pays remet l\'entrepôt à "Tous"', async ({ page }) => {
    const warehouseSelect = page.locator('select').nth(1);
    await page.locator('select').first().selectOption('BRAZIL');
    await warehouseSelect.selectOption({ index: 1 });

    await page.locator('select').first().selectOption('ECUADOR');
    await expect(warehouseSelect).toHaveValue('ALL');
  });

  test('E2E-03-C : navigation vers Stocks', async ({ page }) => {
    await page.click('a:has-text("Stocks"), button:has-text("Stocks")');
    await expect(page).toHaveURL('/direction/stocks');
    await expect(page.locator('table')).toBeVisible();
  });

  test('E2E-03-D : tableau Stocks est trié FIFO par défaut', async ({ page }) => {
    await page.goto('/direction/stocks');
    await page.waitForLoadState('networkidle');
    // Colonnes de la table Stocks : ID, Pays, Entrepôt, Date, Statut — la date est en 4e position.
    const dates = await page.locator('tbody tr td:nth-child(4)').allTextContents();
    const parsed = dates.map(d => {
      const [day, month, year] = d.split('/').map(Number);
      return new Date(year, month - 1, day).getTime();
    });
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i]).toBeGreaterThanOrEqual(parsed[i - 1]);
    }
  });

  test('E2E-03-E : navigation vers Historique', async ({ page }) => {
    await page.click('a:has-text("Historique"), a:has-text("History")');
    await expect(page).toHaveURL('/direction/historique');
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('E2E-03-F : changement de période sur les graphiques', async ({ page }) => {
    // Le sélecteur de période est le dernier select de la page
    const periodSelect = page.locator('select').last();
    await expect(periodSelect).toHaveValue('60d');

    // Changer vers 1d et vérifier que le select a changé
    await periodSelect.selectOption('1d');
    await expect(periodSelect).toHaveValue('1d');

    // Vérifier que les labels de l'axe X sont en format horaire (HH:MM, sur des relevés réels
    // donc pas forcément alignés sur l'heure pile). Les labels Recharts sont dans des <text> SVG.
    await expect(page.locator('svg text').filter({ hasText: /^\d{2}:\d{2}$/ }).first())
      .toBeVisible({ timeout: 5_000 });
  });

  test('E2E-03-G : navigation vers Alertes', async ({ page }) => {
    await page.click('a:has-text("Alertes"), a:has-text("Alerts")');
    await expect(page).toHaveURL('/direction/alertes');
    await expect(async () => {
      const hasAlerts = await page.locator('[class*="border-l-red"]').count();
      const noAlerts = await page.getByText(/Aucune alerte|No active alerts/).count();
      expect(hasAlerts + noAlerts).toBeGreaterThan(0);
    }).toPass();
  });

  test('E2E-03-H : bannière d\'alertes présente si lots en alerte', async ({ page }) => {
    await expect(page.locator('[class*="border-orange"]').first()).toBeVisible();
  });

});