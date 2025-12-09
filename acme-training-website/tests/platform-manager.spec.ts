import { test, expect } from '@playwright/test';

test.describe('Platform Manager Pages', () => {

  test('should load main platform admin pages without errors', async ({ page }) => {
    const adminPages = [
      { path: '/admin', title: 'Dashboard' },
      { path: '/admin/tenants', title: 'Tenant Management' },
      { path: '/admin/settings', title: 'Settings' },
      { path: '/admin/reports', title: 'Reports' },
      { path: '/admin/dashboard', title: 'Dashboard' }
    ];

    for (const adminPage of adminPages) {
      await page.goto(adminPage.path);
      await page.waitForLoadState('networkidle');

      // Check the page loads without major errors
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.locator('text=Page not found')).not.toBeVisible();
      await expect(page.locator('text=Internal Server Error')).not.toBeVisible();
      await expect(page.locator('text=Runtime Error')).not.toBeVisible();

      // Check for loading states vs actual content
      const isLoading = await page.locator('[class*="loading"], [class*="spinner"], text=Loading').count();
      if (isLoading === 0) {
        // Page should have some content if not loading
        const hasContent = await page.locator('h1, h2, h3, .content, main, [role="main"]').count();
        expect(hasContent).toBeGreaterThan(0);
      }
    }
  });

  test('should check admin navigation menu links', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Common admin navigation items
    const navItems = [
      'Dashboard',
      'Tenants',
      'Courses',
      'Bookings',
      'Customers',
      'Settings',
      'Reports',
      'Email Templates'
    ];

    for (const item of navItems) {
      // Look for navigation links
      const navLink = page.locator(`nav a:has-text("${item}"), .sidebar a:has-text("${item}"), .menu a:has-text("${item}")`).first();

      if (await navLink.count() > 0) {
        const href = await navLink.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {

          await navLink.click();
          await page.waitForLoadState('networkidle');

          // Verify the page loads without errors
          await expect(page.locator('text=404')).not.toBeVisible();
          await expect(page.locator('text=Internal Server Error')).not.toBeVisible();

          console.log(`✓ ${item} page loaded successfully: ${page.url()}`);
        }
      }
    }
  });

  test('should test tenant management CRUD operations', async ({ page }) => {
    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');

    // Test Add New Tenant button
    const addButton = page.locator('a:has-text("Add New Tenant"), button:has-text("Add New Tenant")').first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await page.waitForLoadState('networkidle');

      // Should reach add tenant form
      await expect(page.locator('text=404')).not.toBeVisible();
      await expect(page.locator('text=Internal Server Error')).not.toBeVisible();

      // Look for form elements
      const hasForm = await page.locator('form, input[name*="name"], input[name*="email"]').count();
      expect(hasForm).toBeGreaterThan(0);

      // Go back to tenants list
      await page.goto('/admin/tenants');
      await page.waitForLoadState('networkidle');
    }

    // Test tenant list functionality
    await page.waitForSelector('table, .tenant-list, [data-testid="tenant-row"]', { timeout: 10000 });

    const tenants = page.locator('table tbody tr, .tenant-item, [data-testid="tenant-row"]');
    const tenantCount = await tenants.count();

    if (tenantCount > 0) {
      console.log(`Found ${tenantCount} tenants to test`);

      // Test first tenant's actions
      const firstTenant = tenants.first();

      // Look for action buttons
      const actionButtons = firstTenant.locator('button, a').filter({
        hasText: /Edit|View|Delete|Settings|Admin/
      });

      const buttonCount = await actionButtons.count();
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = actionButtons.nth(i);
        const buttonText = await button.textContent();

        if (buttonText && !buttonText.includes('Delete')) {
          await button.click();
          await page.waitForLoadState('networkidle');

          await expect(page.locator('text=404')).not.toBeVisible();
          await expect(page.locator('text=Internal Server Error')).not.toBeVisible();

          console.log(`✓ ${buttonText.trim()} action worked`);

          // Go back to tenants page
          await page.goto('/admin/tenants');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should check tenant subdomain/slug access', async ({ page }) => {
    await page.goto('/admin/tenants');
    await page.waitForLoadState('networkidle');

    // Get tenant slugs from the page
    const tenantLinks = page.locator('a[href*="localhost"], button[data-slug], [data-tenant-slug]');
    const linkCount = await tenantLinks.count();

    if (linkCount > 0) {
      // Test first few tenant links
      const linksToTest = Math.min(linkCount, 3);

      for (let i = 0; i < linksToTest; i++) {
        const link = tenantLinks.nth(i);

        // Try to extract slug or URL
        let tenantUrl = await link.getAttribute('href');
        const slug = await link.getAttribute('data-slug') || await link.getAttribute('data-tenant-slug');

        if (!tenantUrl && slug) {
          tenantUrl = `/${slug}`;
        }

        if (tenantUrl) {
          console.log(`Testing tenant URL: ${tenantUrl}`);

          if (tenantUrl.startsWith('http')) {
            // External link - open in new tab
            const [newPage] = await Promise.all([
              page.context().waitForEvent('page'),
              link.click()
            ]);

            await newPage.waitForLoadState('networkidle');

            const title = await newPage.title();
            const url = newPage.url();

            expect(title).not.toContain('404');
            expect(title).not.toContain('Error');

            console.log(`✓ External tenant page loaded: ${url}`);
            await newPage.close();
          } else {
            // Internal link
            await page.goto(tenantUrl);
            await page.waitForLoadState('networkidle');

            await expect(page.locator('text=404')).not.toBeVisible();
            await expect(page.locator('text=Internal Server Error')).not.toBeVisible();

            console.log(`✓ Internal tenant page loaded: ${tenantUrl}`);
          }

          // Return to admin tenants page
          await page.goto('/admin/tenants');
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });

  test('should verify API endpoints are accessible', async ({ page }) => {
    const apiEndpoints = [
      '/api/admin/tenants',
      '/api/admin/me',
      '/api/courses',
      '/api/auth/session'
    ];

    for (const endpoint of apiEndpoints) {
      const response = await page.request.get(endpoint);

      // API should respond (not necessarily with 200, but not 404)
      expect([200, 401, 403, 500]).toContain(response.status());
      expect(response.status()).not.toBe(404);

      console.log(`✓ API endpoint ${endpoint}: ${response.status()}`);
    }
  });
});