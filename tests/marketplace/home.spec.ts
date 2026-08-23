import { test, expect } from '@playwright/test';

test.describe('Homepage do Marketplace', () => {
  test('carrega a página inicial', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/ObraJá/i);
  });

  test('exibe o header com navegação', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByText('ObraJá')).toBeVisible();
  });

  test('tem link para o catálogo', async ({ page }) => {
    await page.goto('/');
    const catalogLink = page.getByRole('link', { name: /catálogo|ver (todos|mais)/i }).first();
    await expect(catalogLink).toBeVisible();
  });

  test('tem link para o carrinho', async ({ page }) => {
    await page.goto('/');
    const cartLink = page.getByRole('link', { name: /carrinho/i });
    await expect(cartLink).toBeVisible();
  });

  test('seção de categorias está presente', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const section = page.locator('section, [class*="categ"]').first();
    await expect(section).toBeVisible();
  });

  test('navega para o catálogo ao clicar no link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /catálogo/i }).first().click();
    await expect(page).toHaveURL(/\/catalogo/);
  });
});
