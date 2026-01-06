# 🧪 TrainKit Testing Guide

## Overview
Comprehensive testing guide for the TrainKit SaaS platform using Playwright.

---

## Test Suites

### 1. **TrainKit Platform Tests** (`trainkit-platform.spec.ts`)
Tests all the core functionality configured today:
- ✅ Root domain redirect to /admin/login
- ✅ Admin login page branding (TrainKit, not Exeter Digital)
- ✅ Password reset system
- ✅ Student portal branding
- ✅ API endpoints
- ✅ Security & access control
- ✅ Mobile responsiveness

### 2. **Smoke Tests** (`smoke.spec.ts`)
Basic health checks:
- Application starts correctly
- Database connection works
- API responds
- No major errors

### 3. **Admin Portal Tests** (`admin-portal-links.spec.ts`)
Admin interface testing

### 4. **Platform Manager Tests** (`platform-manager.spec.ts`)
Platform management functionality

### 5. **Link Checker** (`link-checker.spec.ts`)
Validates all links work correctly

---

## Running Tests

### Quick Start

```bash
# Navigate to project directory
cd /Users/davidpatheyjohns/Documents/01_Active_Web_Projects/Acme-training.co.uk/acme-training-website

# Run all tests
npm test

# Run TrainKit platform tests only
npm run test:trainkit

# Run smoke tests
npm run test:smoke
```

### Test Options

```bash
# Run with UI (visual test runner)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode (step through tests)
npm run test:debug

# Run specific test file
npx playwright test tests/trainkit-platform.spec.ts

# Run specific test by name
npx playwright test -g "admin login"

# View test report
npm run test:report
```

---

## Test Coverage

### ✅ What We Test

**Routing & Navigation:**
- Root domain redirect
- Admin portal access
- Student portal access
- 404 handling

**Branding & Content:**
- TrainKit branding present
- No exposed default credentials
- Correct contact details
- Provider attribution

**Security:**
- Password fields secured
- Protected routes require auth
- No sensitive data exposed
- Proper error handling

**Functionality:**
- Login forms work
- Password reset flow
- API endpoints exist
- Database connectivity

**Responsive Design:**
- Mobile-friendly layouts
- No horizontal scroll
- Forms usable on mobile

---

## Test Environment

### Configuration
- **Base URL**: `http://localhost:3000`
- **Timeout**: 60 seconds per test
- **Retries**: 0 locally, 2 on CI
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

### Prerequisites
1. **Development server running** (auto-starts)
2. **Database accessible**
3. **Environment variables set** in `.env`

---

## Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something specific', async ({ page }) => {
    // Navigate
    await page.goto('/your-route');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Make assertions
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Best Practices

1. **Use descriptive test names**
   ```typescript
   // Good
   test('admin login should redirect after successful authentication')

   // Bad
   test('login test')
   ```

2. **Wait for elements properly**
   ```typescript
   // Wait for network to be idle
   await page.waitForLoadState('networkidle');

   // Wait for specific element
   await page.waitForSelector('h1');
   ```

3. **Use data-testid for stable selectors**
   ```typescript
   // HTML
   <button data-testid="submit-button">Submit</button>

   // Test
   await page.click('[data-testid="submit-button"]');
   ```

4. **Test user flows, not implementation**
   ```typescript
   // Good - tests user behavior
   test('user can complete checkout', async ({ page }) => {
     await page.goto('/courses');
     await page.click('text=Book Course');
     await page.fill('input[name="email"]', 'test@test.com');
     await page.click('button:has-text("Complete Booking")');
     await expect(page).toHaveURL(/booking-success/);
   });

   // Bad - tests implementation details
   test('checkout button calls API', async ({ page }) => {
     // Testing implementation, not user value
   });
   ```

---

## Debugging Failed Tests

### 1. View Test Report
```bash
npm run test:report
```
Opens HTML report with:
- Test results
- Screenshots on failure
- Video recordings
- Network logs

### 2. Run in Debug Mode
```bash
npm run test:debug
```
Opens Playwright Inspector:
- Step through tests
- Pause execution
- Inspect elements
- View console logs

### 3. Run Specific Test
```bash
npx playwright test -g "test name" --headed
```
Runs only that test with visible browser

### 4. Check Screenshots
Failed tests automatically save screenshots to:
```
test-results/
└── test-name-browser/
    ├── test-failed-1.png
    └── trace.zip
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Common Issues & Solutions

### Issue: Tests Fail Locally

**Solution:**
1. Ensure dev server is running: `npm run dev`
2. Check database is accessible
3. Verify environment variables in `.env`
4. Clear cache: `rm -rf .next`

### Issue: "Timeout waiting for element"

**Solution:**
1. Increase timeout:
   ```typescript
   await page.locator('h1').waitFor({ timeout: 10000 });
   ```
2. Wait for network idle:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```
3. Check element selector is correct

### Issue: Tests pass locally but fail on CI

**Solution:**
1. Check CI environment variables
2. Ensure database seeding works on CI
3. Increase timeouts for slower CI machines
4. Check for race conditions

### Issue: "Cannot find element"

**Solution:**
1. Use Playwright Inspector to check selectors
2. Wait for element to appear:
   ```typescript
   await page.waitForSelector('button');
   ```
3. Check if element is in iframe or shadow DOM

---

## Performance Testing

### Load Time Tests

```typescript
test('homepage should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

### API Response Times

```typescript
test('API should respond quickly', async ({ page }) => {
  const start = Date.now();
  const response = await page.request.get('/api/courses');
  const responseTime = Date.now() - start;

  expect(responseTime).toBeLessThan(500); // 500ms
  expect(response.ok()).toBeTruthy();
});
```

---

## Test Data Management

### Using Test Database

```bash
# Set up test database
DATABASE_URL="postgresql://user:pass@localhost:5432/trainkit_test" npx prisma db push

# Run migrations
npx prisma migrate dev

# Seed test data
npm run seed:admins
```

### Cleanup After Tests

```typescript
test.afterEach(async () => {
  // Clean up test data
  await prisma.booking.deleteMany({
    where: { email: { contains: 'test@' } }
  });
});
```

---

## Success Metrics

### Current Test Coverage
- ✅ 50+ test scenarios
- ✅ Core user journeys tested
- ✅ Security tests included
- ✅ Mobile responsiveness verified
- ✅ API endpoints validated

### Target Metrics
- **Test Coverage**: >80% of critical paths
- **Success Rate**: >95% on CI
- **Test Execution Time**: <5 minutes total
- **Flakiness**: <5% retry rate

---

## Resources

### Playwright Documentation
- **Official Docs**: https://playwright.dev
- **API Reference**: https://playwright.dev/docs/api/class-test
- **Best Practices**: https://playwright.dev/docs/best-practices

### TrainKit Specific
- Review: `SAAS_BILLING_REFERENCE.md` for subscription flows
- Review: `MULTI_CLIENT_SETUP_GUIDE.md` for tenant tests
- Review: `STRIPE_SETUP_GUIDE.md` for payment testing

---

## 🎯 Quick Reference

### Run Tests
```bash
npm test                    # All tests
npm run test:trainkit       # TrainKit platform
npm run test:smoke          # Smoke tests
npm run test:ui             # Visual test runner
npm run test:headed         # See browser
npm run test:debug          # Debug mode
```

### View Results
```bash
npm run test:report         # HTML report
```

### Common Commands
```bash
npx playwright test --grep "login"     # Run tests matching "login"
npx playwright test --project chromium # Run in specific browser
npx playwright codegen localhost:3000  # Record new tests
```

---

**Happy Testing! 🚀**
