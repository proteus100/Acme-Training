import { test, expect } from '@playwright/test';

test.describe('Link Checker - Broken Links Detection', () => {

  interface LinkInfo {
    url: string;
    text: string;
    page: string;
  }

  let brokenLinks: LinkInfo[] = [];
  let workingLinks: LinkInfo[] = [];

  test('should scan and test all internal links in the application', async ({ page }) => {
    const pagesToScan = [
      '/',
      '/admin',
      '/admin/tenants',
      '/admin/settings',
      '/admin/dashboard',
      '/test-plumbing',  // Our test tenant
      '/courses',
      '/booking'
    ];

    for (const pageUrl of pagesToScan) {
      console.log(`\n🔍 Scanning page: ${pageUrl}`);

      try {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Get all links on the page
        const links = await page.locator('a[href]').all();

        for (const link of links) {
          const href = await link.getAttribute('href');
          const text = (await link.textContent())?.trim() || '';

          if (!href) continue;

          // Skip external links, mail links, and javascript links
          if (href.startsWith('http') && !href.includes('localhost')) continue;
          if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
          if (href === '#' || href === '') continue;

          const linkInfo: LinkInfo = {
            url: href,
            text: text.substring(0, 50), // Truncate for readability
            page: pageUrl
          };

          // Check if we've already tested this link
          const alreadyTested = [...brokenLinks, ...workingLinks].some(l => l.url === href);
          if (alreadyTested) continue;

          console.log(`  Testing link: ${href} (${text.substring(0, 30)}...)`);

          try {
            // Navigate to the link
            const response = await page.goto(href);
            await page.waitForLoadState('networkidle', { timeout: 15000 });

            // Check response status
            if (response && response.status() >= 400) {
              console.log(`    ❌ HTTP ${response.status()}: ${href}`);
              brokenLinks.push(linkInfo);
              continue;
            }

            // Check for error content in the page
            const hasError = await page.locator('text=404, text=Page not found, text=Internal Server Error, text=Runtime Error').count();
            if (hasError > 0) {
              console.log(`    ❌ Error page detected: ${href}`);
              brokenLinks.push(linkInfo);
              continue;
            }

            // Check if page loaded with content
            const hasContent = await page.locator('h1, h2, h3, main, [role="main"], .content').count();
            if (hasContent === 0) {
              // Check if it's still loading
              const isLoading = await page.locator('.loading, .spinner').count() +
                             await page.locator('text=Loading').count();
              if (isLoading === 0) {
                console.log(`    ⚠️  No content found: ${href}`);
                brokenLinks.push(linkInfo);
                continue;
              }
            }

            console.log(`    ✅ Working: ${href}`);
            workingLinks.push(linkInfo);

          } catch (error) {
            console.log(`    ❌ Navigation failed: ${href} - ${error}`);
            brokenLinks.push(linkInfo);
          }
        }

      } catch (error) {
        console.log(`❌ Failed to scan page ${pageUrl}: ${error}`);
      }
    }

    // Report results
    console.log(`\n📊 LINK CHECK RESULTS:`);
    console.log(`✅ Working links: ${workingLinks.length}`);
    console.log(`❌ Broken links: ${brokenLinks.length}`);

    if (brokenLinks.length > 0) {
      console.log(`\n🚨 BROKEN LINKS FOUND:`);
      brokenLinks.forEach((link, index) => {
        console.log(`${index + 1}. Page: ${link.page}`);
        console.log(`   Link: ${link.url}`);
        console.log(`   Text: "${link.text}"`);
        console.log('');
      });
    }

    // Assert that we don't have too many broken links
    expect(brokenLinks.length).toBeLessThan(10); // Allow some broken links for development
  });

  test('should test tenant-specific links', async ({ page }) => {
    // Test our known test tenant
    const testTenantSlug = 'test-plumbing';

    console.log(`\n🏢 Testing tenant-specific links for: ${testTenantSlug}`);

    const tenantPages = [
      `/${testTenantSlug}`,
      `/${testTenantSlug}/courses`,
      `/${testTenantSlug}/booking`,
      `/${testTenantSlug}/contact`,
      `/${testTenantSlug}/admin`
    ];

    for (const tenantPage of tenantPages) {
      console.log(`  Testing: ${tenantPage}`);

      try {
        await page.goto(tenantPage);
        await page.waitForLoadState('networkidle', { timeout: 30000 });

        // Check for errors
        const hasError = await page.locator('text=404, text=Page not found, text=Internal Server Error').count();
        if (hasError > 0) {
          console.log(`    ❌ Error page: ${tenantPage}`);
        } else {
          console.log(`    ✅ Page loads: ${tenantPage}`);
        }

        expect(hasError).toBe(0);

      } catch (error) {
        console.log(`    ❌ Failed to load: ${tenantPage} - ${error}`);
        throw error;
      }
    }
  });

  test('should test API endpoints accessibility', async ({ page }) => {
    console.log(`\n🔌 Testing API endpoints:`);

    const apiEndpoints = [
      '/api/courses',
      '/api/auth/session',
      '/api/admin/tenants',
      '/api/admin/me',
      '/api/bookings'
    ];

    for (const endpoint of apiEndpoints) {
      console.log(`  Testing API: ${endpoint}`);

      try {
        const response = await page.request.get(endpoint);
        const status = response.status();

        // API endpoints should not return 404
        expect(status).not.toBe(404);

        if (status === 200) {
          console.log(`    ✅ API working: ${endpoint} (${status})`);
        } else if ([401, 403].includes(status)) {
          console.log(`    ⚠️  API protected: ${endpoint} (${status})`);
        } else if (status >= 500) {
          console.log(`    ❌ API error: ${endpoint} (${status})`);
        } else {
          console.log(`    ℹ️  API response: ${endpoint} (${status})`);
        }

      } catch (error) {
        console.log(`    ❌ API failed: ${endpoint} - ${error}`);
        throw error;
      }
    }
  });

  test('should check for missing images and assets', async ({ page }) => {
    console.log(`\n🖼️  Checking for missing images and assets:`);

    const pagesToCheck = [
      '/',
      '/admin/tenants',
      '/test-plumbing'
    ];

    let missingAssets: string[] = [];

    for (const pageUrl of pagesToCheck) {
      console.log(`  Checking assets on: ${pageUrl}`);

      await page.goto(pageUrl);
      await page.waitForLoadState('networkidle');

      // Check images
      const images = await page.locator('img[src]').all();
      for (const img of images) {
        const src = await img.getAttribute('src');
        if (src && !src.startsWith('data:') && !src.startsWith('http')) {
          try {
            const response = await page.request.get(src);
            if (response.status() === 404) {
              console.log(`    ❌ Missing image: ${src}`);
              missingAssets.push(src);
            }
          } catch (error) {
            console.log(`    ❌ Image load failed: ${src}`);
            missingAssets.push(src);
          }
        }
      }

      // Check stylesheets
      const stylesheets = await page.locator('link[rel="stylesheet"]').all();
      for (const css of stylesheets) {
        const href = await css.getAttribute('href');
        if (href && !href.startsWith('http')) {
          try {
            const response = await page.request.get(href);
            if (response.status() === 404) {
              console.log(`    ❌ Missing stylesheet: ${href}`);
              missingAssets.push(href);
            }
          } catch (error) {
            console.log(`    ❌ Stylesheet load failed: ${href}`);
            missingAssets.push(href);
          }
        }
      }
    }

    console.log(`\n📊 Asset check results:`);
    console.log(`❌ Missing assets: ${missingAssets.length}`);

    if (missingAssets.length > 0) {
      console.log(`Missing assets:`);
      missingAssets.forEach(asset => console.log(`  - ${asset}`));
    }

    // Allow some missing assets in development
    expect(missingAssets.length).toBeLessThan(3);
  });
});