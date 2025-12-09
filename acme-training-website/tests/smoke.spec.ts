import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Functionality', () => {

  test('application should start and load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should not show error pages
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
    await expect(page.locator('text=Runtime Error')).not.toBeVisible();

    // Should have some content
    const hasContent = await page.locator('h1, h2, main, [role="main"]').count();
    expect(hasContent).toBeGreaterThan(0);
  });

  test('admin portal should be accessible', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Should load without major errors
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
  });

  test('tenant system should work with test tenant', async ({ page }) => {
    await page.goto('/test-plumbing');
    await page.waitForLoadState('networkidle');

    // Should load tenant page without errors
    await expect(page.locator('text=404')).not.toBeVisible();
    await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
  });

  test('API should respond', async ({ page }) => {
    const apiTests = [
      { endpoint: '/api/courses', minStatus: 200, maxStatus: 299 },
      { endpoint: '/api/auth/session', minStatus: 200, maxStatus: 401 }
    ];

    for (const { endpoint, minStatus, maxStatus } of apiTests) {
      const response = await page.request.get(endpoint);
      const status = response.status();

      expect(status).toBeGreaterThanOrEqual(minStatus);
      expect(status).toBeLessThanOrEqual(maxStatus);
      expect(status).not.toBe(404); // Should not be not found
    }
  });

  test('database connection should work', async ({ page }) => {
    // Test that admin tenants page loads data (requires DB)
    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');

    // Should not show database connection errors
    const dbErrorSelectors = [
      'text=PrismaClientInitializationError',
      'text=database connection failed',
      'text=ECONNREFUSED',
      'text=Connection refused'
    ];

    for (const selector of dbErrorSelectors) {
      await expect(page.locator(selector)).not.toBeVisible();
    }

    // Should show tenant management interface
    await expect(page.locator('h1, h2, h3').first()).toContainText(/admin|portal|tenant|management/i);
  });
});