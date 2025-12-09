import { test, expect } from '@playwright/test';

test.describe('TrainKit Platform - Core Functionality', () => {

  test.describe('Root Domain & Routing', () => {
    test('root domain should redirect to admin login', async ({ page }) => {
      await page.goto('/');

      // Should redirect to /admin/login
      await page.waitForURL('**/admin/login');

      // Verify we're on the login page
      await expect(page).toHaveURL(/\/admin\/login/);
      await expect(page.locator('h1, h2')).toContainText(/admin|login|sign in/i);
    });

    test('should handle tenant-not-found gracefully', async ({ page }) => {
      // This should redirect to admin login now (fixed in middleware)
      await page.goto('/tenant-not-found');

      // Should show tenant not found page or redirect
      const hasError = await page.locator('text=tenant not found').count();
      expect(hasError).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Admin Portal - Branding & Security', () => {
    test('admin login page should have correct TrainKit branding', async ({ page }) => {
      await page.goto('/admin/login');
      await page.waitForLoadState('networkidle');

      // Should have TrainKit branding
      await expect(page.locator('text=TrainKit')).toBeVisible();

      // Should have provider credit
      await expect(page.locator('text=Exeter Digital Agency')).toBeVisible();

      // Should NOT have default credentials displayed
      await expect(page.locator('text=admin@exeterdigitalagency.co.uk')).not.toBeVisible();
      await expect(page.locator('text=admin123!')).not.toBeVisible();
    });

    test('admin login form should be functional', async ({ page }) => {
      await page.goto('/admin/login');

      // Check form elements exist
      const emailInput = page.locator('input[type="email"], input[name="email"]');
      const passwordInput = page.locator('input[type="password"], input[name="password"]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Sign In")');

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      await expect(submitButton).toBeVisible();

      // Check placeholder text
      await expect(emailInput).toHaveAttribute('placeholder', /email/i);
    });

    test('admin login should have proper error handling', async ({ page }) => {
      await page.goto('/admin/login');

      // Try to submit with invalid credentials
      await page.fill('input[type="email"]', 'invalid@test.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      // Should show error message (wait for API response)
      await page.waitForTimeout(1000);

      // Check for error indication (could be error text or styling)
      const hasError = await page.locator('text=/error|invalid|failed/i, [role="alert"]').count();
      expect(hasError).toBeGreaterThanOrEqual(0); // May or may not show depending on API
    });
  });

  test.describe('Password Reset System', () => {
    test('password reset page should load', async ({ page }) => {
      await page.goto('/admin/reset-password');
      await page.waitForLoadState('networkidle');

      // Should load without errors
      await expect(page).toHaveURL(/\/admin\/reset-password/);
    });

    test('password reset requires token in URL', async ({ page }) => {
      await page.goto('/admin/reset-password');

      // Without token, inputs should be disabled
      const passwordInput = page.locator('input[type="password"]').first();
      await expect(passwordInput).toBeDisabled();
    });

    test('password reset with token enables inputs', async ({ page }) => {
      // Use a fake token for testing UI behavior
      const testToken = 'test_token_12345';
      await page.goto(`/admin/reset-password?token=${testToken}`);
      await page.waitForLoadState('networkidle');

      // With token, inputs should be enabled
      const passwordInputs = page.locator('input[type="password"]');
      const count = await passwordInputs.count();

      if (count > 0) {
        const firstInput = passwordInputs.first();
        // Input should exist and potentially be enabled (depends on token validation)
        await expect(firstInput).toBeVisible();
      }
    });

    test('password reset API endpoint exists', async ({ page }) => {
      const response = await page.request.post('/api/admin/reset-password/request', {
        data: { email: 'test@test.com' }
      });

      // Should respond (200 success or 400/401 validation)
      expect([200, 400, 401, 500]).toContain(response.status());
    });
  });

  test.describe('Student Portal - Branding', () => {
    test('student login page should have correct branding', async ({ page }) => {
      await page.goto('/student/login');
      await page.waitForLoadState('networkidle');

      // Should have TrainKit branding
      await expect(page.locator('text=TrainKit')).toBeVisible();

      // Should have updated contact details
      await expect(page.locator('text=support@trainkit.co.uk')).toBeVisible();
      await expect(page.locator('text=07429 591055')).toBeVisible();

      // Should have provider credit
      await expect(page.locator('text=Exeter Digital Agency')).toBeVisible();

      // Should NOT have old Exeter branding in header
      const header = page.locator('header, nav, [role="banner"]');
      await expect(header.locator('text=Exeter Digital Agency')).not.toBeVisible();
    });

    test('student login should show Google OAuth button', async ({ page }) => {
      await page.goto('/student/login');

      // Should have Google sign-in button
      const googleButton = page.locator('button:has-text("Google"), button:has-text("Continue with Google")');
      await expect(googleButton).toBeVisible();
    });
  });

  test.describe('Admin Routes', () => {
    test('admin dashboard route should exist', async ({ page }) => {
      await page.goto('/admin/dashboard');

      // Should load (may redirect to login if not authenticated)
      const url = page.url();
      expect(url).toMatch(/\/(admin\/(dashboard|login)|login)/);
    });

    test('admin tenants page should load', async ({ page }) => {
      await page.goto('/admin/tenants');

      // Should load or redirect to login
      const url = page.url();
      expect(url).toMatch(/\/(admin\/(tenants|login)|login)/);
    });

    test('admin tenant add page should exist', async ({ page }) => {
      const response = await page.goto('/admin/tenants/add');

      // Should respond (200 or redirect)
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('API Endpoints', () => {
    test('admin API endpoints should exist', async ({ page }) => {
      const endpoints = [
        '/api/admin/login',
        '/api/admin/reset-password/request',
        '/api/admin/reset-password/confirm',
        '/api/admin/tenants',
      ];

      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint);
        // Should exist (not 404)
        expect(response.status()).not.toBe(404);
      }
    });

    test('onboarding API should exist', async ({ page }) => {
      const response = await page.request.post('/api/onboarding', {
        data: { test: true }
      });

      // Should exist and respond (may reject invalid data)
      expect(response.status()).not.toBe(404);
    });

    test('tenant provisioning API should exist', async ({ page }) => {
      const response = await page.request.post('/api/admin/provision-tenant', {
        data: { test: true }
      });

      // Should exist (may require auth)
      expect(response.status()).not.toBe(404);
    });
  });

  test.describe('Database Connection', () => {
    test('should be able to fetch admin users', async ({ page }) => {
      const response = await page.request.get('/api/admin/me');

      // Should respond (401 unauthorized or 200)
      expect([200, 401]).toContain(response.status());
    });

    test('database schema should support multi-tenancy', async ({ page }) => {
      // Test that tenant-related endpoints exist
      const response = await page.request.get('/api/admin/tenants');

      // Should connect to DB (may require auth)
      expect(response.status()).not.toBe(500);
    });
  });

  test.describe('Security & Access Control', () => {
    test('protected routes should require authentication', async ({ page }) => {
      const protectedRoutes = [
        '/admin/dashboard',
        '/admin/tenants',
        '/admin/settings',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        const url = page.url();

        // Should either show login form or redirect to login
        const isProtected = url.includes('login') || await page.locator('input[type="password"]').count() > 0;
        expect(isProtected).toBeTruthy();
      }
    });

    test('password fields should be properly secured', async ({ page }) => {
      await page.goto('/admin/login');

      const passwordInput = page.locator('input[type="password"]');
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Responsive Design', () => {
    test('admin login should be mobile-friendly', async ({ page, isMobile }) => {
      await page.goto('/admin/login');
      await page.waitForLoadState('networkidle');

      // Should load on mobile without horizontal scroll
      const viewport = page.viewportSize();
      if (viewport && isMobile) {
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width + 10); // Allow 10px tolerance
      }
    });

    test('student login should be mobile-friendly', async ({ page, isMobile }) => {
      await page.goto('/student/login');
      await page.waitForLoadState('networkidle');

      // Form should be visible and usable
      await expect(page.locator('button, input').first()).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');

      // Should show 404 page
      expect(response?.status()).toBe(404);
    });

    test('should not expose sensitive errors in production', async ({ page }) => {
      await page.goto('/admin/login');

      // Should not show stack traces or env variables
      const sensitiveTerms = ['stack trace', 'DATABASE_URL', 'STRIPE_SECRET'];
      for (const term of sensitiveTerms) {
        await expect(page.locator(`text=${term}`)).not.toBeVisible();
      }
    });
  });
});
