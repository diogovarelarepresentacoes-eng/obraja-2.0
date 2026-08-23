import { test, expect } from '@playwright/test';

test.describe('Proteção de rotas — Middleware do Fornecedor', () => {
  test('/ redireciona para /dashboard', async ({ page }) => {
    // Sem cookie → redireciona para /login
    await page.goto('/');
    await expect(page).toHaveURL(/\/login|\/dashboard/);
  });

  test('/dashboard sem autenticação redireciona para /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/produtos sem autenticação redireciona para /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/produtos');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/pedidos sem autenticação redireciona para /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/pedidos');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/perfil sem autenticação redireciona para /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/perfil');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login com cookie de autenticação redireciona para /dashboard', async ({ page }) => {
    await page.context().addCookies([{
      name: 'obraja_supplier_has_token',
      value: '1',
      domain: 'localhost',
      path: '/',
    }]);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('/cadastro com cookie de autenticação redireciona para /dashboard', async ({ page }) => {
    await page.context().addCookies([{
      name: 'obraja_supplier_has_token',
      value: '1',
      domain: 'localhost',
      path: '/',
    }]);
    await page.goto('/cadastro');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
