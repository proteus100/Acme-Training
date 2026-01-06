import { test, expect } from '@playwright/test';

test.describe('Admin Portal Links', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to admin tenants page
    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin tenants page without errors', async ({ page }) => {
    await expect(page).toHaveTitle(/Tenant Management|Admin/);

    // Check for main elements
    await expect(page.locator('h1')).toContainText('Tenant Management');
    await expect(page.locator('text=Add New Tenant')).toBeVisible();
  });

  test('should have working navigation links in admin header', async ({ page }) => {
    const adminLinks = [
      { text: 'Dashboard', href: '/admin' },
      { text: 'Tenants', href: '/admin/tenants' },
      { text: 'Settings', href: '/admin/settings' }
    ];

    for (const link of adminLinks) {
      const linkElement = page.locator(`a[href="${link.href}"]`).first();
      if (await linkElement.count() > 0) {
        await linkElement.click();
        await page.waitForLoadState('networkidle');

        // Should not show 404 or error pages
        await expect(page.locator('text=404')).not.toBeVisible();
        await expect(page.locator('text=Page not found')).not.toBeVisible();
        await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
      }
    }
  });

  test('should load tenant details for each tenant', async ({ page }) => {
    // Wait for tenants to load
    await page.waitForSelector('[data-testid="tenant-row"], .tenant-row, table tbody tr', { timeout: 10000 });

    // Get all tenant rows
    const tenantRows = page.locator('table tbody tr, [data-testid="tenant-row"]');
    const rowCount = await tenantRows.count();

    if (rowCount > 0) {
      // Test first few tenants (limit to avoid long test times)
      const tenantsToTest = Math.min(rowCount, 3);

      for (let i = 0; i < tenantsToTest; i++) {
        const row = tenantRows.nth(i);

        // Look for edit button or tenant link
        const editButton = row.locator('button[title*="Edit"], a[href*="/edit/"], button:has-text("Edit")').first();
        const viewButton = row.locator('button[title*="View"], a[href*="view"], button:has-text("View")').first();

        if (await editButton.count() > 0) {
          await editButton.click();
          await page.waitForLoadState('networkidle');

          // Check if edit page loads properly
          await expect(page.locator('text=404')).not.toBeVisible();
          await expect(page.locator('text=Internal Server Error')).not.toBeVisible();

          // Go back to tenants page
          await page.goto('/admin/tenants');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should handle tenant action buttons without errors', async ({ page }) => {
    // Wait for tenants to load
    await page.waitForSelector('table tbody tr, [data-testid="tenant-row"]', { timeout: 10000 });

    const tenantRows = page.locator('table tbody tr, [data-testid="tenant-row"]');
    const rowCount = await tenantRows.count();

    if (rowCount > 0) {
      const firstRow = tenantRows.first();

      // Test dropdown/more actions menu
      const moreButton = firstRow.locator('button[title*="More"], button:has([class*="vertical"]), button:has-text("⋮")').first();

      if (await moreButton.count() > 0) {
        await moreButton.click();

        // Wait for dropdown to appear
        await page.waitForTimeout(500);

        // Check for common action buttons
        const actions = [
          'Activate',
          'Deactivate',
          'Edit',
          'Delete',
          'View',
          'Admin Portal'
        ];

        for (const action of actions) {
          const actionButton = page.locator(`button:has-text("${action}"), a:has-text("${action}")`).first();
          if (await actionButton.count() > 0) {
            // Just verify the button exists and is visible, don't click delete
            if (action !== 'Delete') {
              await expect(actionButton).toBeVisible();
            }
          }
        }

        // Click away to close dropdown
        await page.click('body');
      }
    }
  });

  test('should check tenant external links work', async ({ page }) => {
    await page.waitForSelector('table tbody tr, [data-testid="tenant-row"]', { timeout: 10000 });

    const tenantRows = page.locator('table tbody tr, [data-testid="tenant-row"]');
    const rowCount = await tenantRows.count();

    if (rowCount > 0) {
      // Look for view/external link buttons
      const viewButtons = page.locator('button[title*="View"], a[href*="localhost"], button:has([class*="external"])');
      const buttonCount = await viewButtons.count();

      if (buttonCount > 0) {
        // Test first external link
        const firstViewButton = viewButtons.first();

        // Listen for new page/popup
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page'),
          firstViewButton.click()
        ]);

        // Wait for the new page to load
        await newPage.waitForLoadState('networkidle');

        // Check if the tenant page loads without major errors
        const url = newPage.url();
        expect(url).toContain('localhost');

        // Check it's not a 404 or error page
        const title = await newPage.title();
        expect(title).not.toContain('404');
        expect(title).not.toContain('Error');

        await newPage.close();
      }
    }
  });
});