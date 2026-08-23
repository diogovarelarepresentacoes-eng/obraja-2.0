import { test, expect } from '@playwright/test';

test.describe('Cadastro de Entregador', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cadastro-entregador');
    await page.waitForLoadState('domcontentloaded');
  });

  test('carrega a página de cadastro', async ({ page }) => {
    await expect(page).toHaveURL(/\/cadastro-entregador/);
    await expect(page.getByText('ObraJá').first()).toBeVisible();
    await expect(page.getByText('Cadastro de Entregador')).toBeVisible();
  });

  test('exibe os 4 passos no indicador de progresso', async ({ page }) => {
    // Labels dos passos ficam em <span> dentro do progress indicator
    const stepLabels = page.locator('span.whitespace-nowrap');
    await expect(stepLabels.filter({ hasText: 'Dados pessoais' })).toBeVisible();
    await expect(stepLabels.filter({ hasText: 'Veículo' })).toBeVisible();
    await expect(stepLabels.filter({ hasText: 'Acesso' })).toBeVisible();
    await expect(stepLabels.filter({ hasText: 'Documentos' })).toBeVisible();
  });

  test('passo 1 exibe campos de nome, CPF, e-mail e telefone', async ({ page }) => {
    // Heading do passo 1
    await expect(page.locator('h2').filter({ hasText: 'Dados pessoais' })).toBeVisible();
    // Label "CPF *"
    await expect(page.locator('label').filter({ hasText: 'CPF' }).first()).toBeVisible();
    // Input e-mail
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Label "Telefone *"
    await expect(page.locator('label').filter({ hasText: 'Telefone' })).toBeVisible();
  });

  test('máscara de CPF formata corretamente ao digitar', async ({ page }) => {
    const cpfInput = page.locator('input[placeholder="000.000.000-00"]');
    await cpfInput.fill('12345678901');
    const value = await cpfInput.inputValue();
    expect(value).toBe('123.456.789-01');
  });

  test('exibe erro ao avançar sem preencher campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: /continuar/i }).click();
    // Validação via setError() — aparece em um elemento com classe de vermelho
    await expect(page.locator('p').filter({ hasText: /obrigatório|inválido/i })).toBeVisible({ timeout: 3000 });
  });

  test('exibe mensagem "Nome obrigatório" ao avançar vazio', async ({ page }) => {
    await page.getByRole('button', { name: /continuar/i }).click();
    await expect(page.getByText('Nome obrigatório')).toBeVisible({ timeout: 3000 });
  });

  test('avança para o passo 2 ao preencher dados pessoais válidos', async ({ page }) => {
    await page.locator('input[placeholder="João"]').fill('João');
    await page.locator('input[placeholder="Silva"]').fill('Silva');
    await page.locator('input[placeholder="000.000.000-00"]').fill('529.982.247-25');
    await page.locator('input[type="email"]').fill('joao@email.com');
    await page.locator('input[placeholder="(00) 99999-9999"]').fill('(11) 91234-5678');

    await page.getByRole('button', { name: /continuar/i }).click();

    // Passo 2: heading "Dados do veículo"
    await expect(page.locator('h2').filter({ hasText: /veículo/i })).toBeVisible({ timeout: 5000 });
  });

  test('passo 2 exibe select de tipo de veículo com opções', async ({ page }) => {
    await page.locator('input[placeholder="João"]').fill('Ana');
    await page.locator('input[placeholder="Silva"]').fill('Costa');
    await page.locator('input[placeholder="000.000.000-00"]').fill('529.982.247-25');
    await page.locator('input[type="email"]').fill('ana@email.com');
    await page.locator('input[placeholder="(00) 99999-9999"]').fill('(11) 98765-4321');
    await page.getByRole('button', { name: /continuar/i }).click();

    // Verifica o select de tipo de veículo (não as options individuais)
    const vehicleSelect = page.locator('select');
    await expect(vehicleSelect).toBeVisible({ timeout: 5000 });
    // Verifica que as opções existem no DOM
    await expect(vehicleSelect.locator('option[value="MOTO"]')).toHaveCount(1);
    await expect(vehicleSelect.locator('option[value="CARRO"]')).toHaveCount(1);
    await expect(vehicleSelect.locator('option[value="VAN"]')).toHaveCount(1);
  });

  test('página pendente exibe status de análise', async ({ page }) => {
    await page.goto('/cadastro-entregador/pendente');
    await expect(page.getByText(/cadastro em análise/i)).toBeVisible();
    await expect(page.getByText(/48 horas úteis/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /voltar ao início/i })).toBeVisible();
  });
});
