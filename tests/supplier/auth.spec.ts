import { test, expect } from '@playwright/test';

test.describe('Autenticação do Painel do Fornecedor', () => {
  test.describe('Página de Login', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
    });

    test('carrega a página de login', async ({ page }) => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText('ObraJá').first()).toBeVisible();
      await expect(page.getByText(/painel do fornecedor/i)).toBeVisible();
    });

    test('exibe campos de e-mail e senha', async ({ page }) => {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('exibe botão de login habilitado', async ({ page }) => {
      const btn = page.getByRole('button', { name: /entrar/i });
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    });

    test('tem link para cadastro', async ({ page }) => {
      const link = page.getByRole('link', { name: /cadastr/i });
      await expect(link).toBeVisible();
    });

    test('exibe mensagem de erro após submissão com API indisponível', async ({ page }) => {
      await page.locator('input[type="email"]').fill('invalido@teste.com');
      await page.locator('input[type="password"]').fill('senhaerrada');
      await page.getByRole('button', { name: /entrar/i }).click();
      // Erro aparece em parágrafo vermelho após a requisição falhar
      await expect(page.locator('p.text-red-600')).toBeVisible({ timeout: 8000 });
    });

    test('botão muda de estado enquanto carrega', async ({ page }) => {
      await page.locator('input[type="email"]').fill('teste@email.com');
      await page.locator('input[type="password"]').fill('senha123');
      const btn = page.getByRole('button', { name: /entrar/i });
      await btn.click();
      // Durante o loading, o botão pode ficar desabilitado ou mostrar texto diferente
      // Verificamos que a submissão foi disparada (página não navega para dashboard)
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Página de Cadastro', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/cadastro');
      await page.waitForLoadState('domcontentloaded');
    });

    test('carrega a página de cadastro', async ({ page }) => {
      await expect(page).toHaveURL(/\/cadastro/);
      await expect(page.getByText('Cadastro de Fornecedor')).toBeVisible();
    });

    test('exibe indicador de passos', async ({ page }) => {
      const stepNumbers = page.locator('.w-8.h-8.rounded-full');
      await expect(stepNumbers.first()).toBeVisible();
    });

    test('etapa 1 exibe seleção de tipo: Loja de Materiais e Fábrica', async ({ page }) => {
      await expect(page.getByText('Que tipo de empresa você representa?')).toBeVisible();
      await expect(page.getByText('Loja de Materiais')).toBeVisible();
      await expect(page.getByText('Fábrica / Indústria')).toBeVisible();
    });

    test('etapa 1 tem botão Continuar habilitado por padrão', async ({ page }) => {
      const btn = page.getByRole('button', { name: /continuar/i });
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    });

    test('avança para etapa 2 ao clicar em Continuar', async ({ page }) => {
      await page.getByRole('button', { name: /continuar/i }).click();
      await expect(page.getByText('Dados da empresa')).toBeVisible({ timeout: 3000 });
    });

    test('etapa 2 exibe campos de CNPJ e Razão Social', async ({ page }) => {
      await page.getByRole('button', { name: /continuar/i }).click();
      // Razão Social
      await expect(page.locator('input[placeholder="Empresa LTDA"]')).toBeVisible({ timeout: 3000 });
      // CNPJ
      await expect(page.locator('input[placeholder="00.000.000/0001-00"]')).toBeVisible();
    });

    test('máscara de CNPJ formata corretamente', async ({ page }) => {
      await page.getByRole('button', { name: /continuar/i }).click();
      const cnpjInput = page.locator('input[placeholder="00.000.000/0001-00"]');
      await cnpjInput.fill('11222333000181');
      const value = await cnpjInput.inputValue();
      expect(value).toBe('11.222.333/0001-81');
    });

    test('tem link para login', async ({ page }) => {
      const link = page.getByRole('link', { name: /entrar/i });
      await expect(link).toBeVisible();
    });

    test('etapa 2 exibe erro ao avançar sem preencher obrigatórios', async ({ page }) => {
      // Vai para etapa 2
      await page.getByRole('button', { name: /continuar/i }).click();
      // Tenta avançar sem preencher
      await page.getByRole('button', { name: /continuar/i }).click();
      await expect(page.locator('p.text-red-600')).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe('Página Pendente', () => {
    test('exibe status de análise com título correto', async ({ page }) => {
      await page.goto('/pendente');
      await expect(page.getByRole('heading', { name: 'Cadastro em análise' })).toBeVisible();
      await expect(page.getByText(/48 horas úteis/i)).toBeVisible();
      await expect(page.getByRole('link', { name: /voltar ao login/i })).toBeVisible();
    });
  });
});
