# Testing Guide - Playwright End-to-End Testing

This document explains how to use Playwright to test the application and catch broken links in both admin portals and platform manager pages.

## Setup

Playwright has been installed and configured. The tests run against your local development server on `http://localhost:3003`.

## Available Test Commands

### Quick Start
```bash
# Run smoke tests (basic functionality check)
npm run test:smoke

# Check for broken links across the application
npm run test:links

# Test admin portal functionality
npm run test:admin

# Test platform manager pages
npm run test:platform
```

### All Tests
```bash
# Run all tests
npm run test

# Run tests with browser UI (visual)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests step by step
npm run test:debug

# View test report
npm run test:report
```

## Test Suites

### 1. Smoke Tests (`tests/smoke.spec.ts`)
- **Purpose**: Quick validation that core functionality works
- **Tests**:
  - Homepage loads without errors
  - Admin portal is accessible
  - Test tenant system works
  - API endpoints respond
  - Database connection works

### 2. Link Checker (`tests/link-checker.spec.ts`)
- **Purpose**: Find and report broken links across the application
- **Tests**:
  - Scans all internal links on key pages
  - Tests tenant-specific links
  - Validates API endpoint accessibility
  - Checks for missing images and assets
- **Reports**: Lists all broken links with page location and link text

### 3. Admin Portal Tests (`tests/admin-portal-links.spec.ts`)
- **Purpose**: Validate admin portal functionality and navigation
- **Tests**:
  - Admin tenants page loads correctly
  - Navigation links work
  - Tenant detail pages load
  - Action buttons function without errors
  - External tenant links work

### 4. Platform Manager Tests (`tests/platform-manager.spec.ts`)
- **Purpose**: Test platform-level management features
- **Tests**:
  - All admin pages load without errors
  - Admin navigation menu works
  - Tenant CRUD operations
  - Tenant subdomain access
  - API endpoint validation

## Understanding Test Results

### ✅ Passing Tests
- Green checkmarks indicate working functionality
- Links and pages load successfully
- No broken functionality detected

### ❌ Failing Tests
- Red X marks indicate issues found
- Check console output for details
- Common issues:
  - 404 errors (page not found)
  - 500 errors (server errors)
  - Missing navigation elements
  - Broken external links

### ⚠️ Warnings
- Yellow warnings indicate potential issues
- May include:
  - Slow loading pages
  - Protected API endpoints (401/403)
  - Missing optional content

## Test Configuration

The tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:3003`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Screenshots**: Taken on failures
- **Videos**: Recorded on failures
- **Traces**: Available for debugging

## Running Tests in Development

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Run tests in another terminal**:
   ```bash
   # Quick check
   npm run test:smoke

   # Full link validation
   npm run test:links
   ```

3. **View results**:
   ```bash
   npm run test:report
   ```

## Continuous Integration

For CI/CD pipelines, use:
```bash
# Headless mode for CI
npm run test

# With retries for flaky tests
npx playwright test --retries=2
```

## Debugging Failed Tests

1. **Run with browser visible**:
   ```bash
   npm run test:headed
   ```

2. **Debug step by step**:
   ```bash
   npm run test:debug
   ```

3. **Check screenshots** in `test-results/` folder

4. **View detailed report**:
   ```bash
   npm run test:report
   ```

## Common Issues and Solutions

### Test Fails: "Page not found (404)"
- Check if the route exists in your Next.js app
- Verify the URL structure matches your file structure
- Check for typos in route names

### Test Fails: "Internal Server Error (500)"
- Check server logs for error details
- Verify database connection
- Check for missing environment variables

### Test Fails: "Network timeout"
- Increase timeout in test configuration
- Check if development server is running
- Verify the correct port (3003)

### No Content Found
- Page might still be loading
- Check for loading states
- Verify data is being fetched correctly

## Best Practices

1. **Run tests regularly** during development
2. **Fix broken links immediately** to prevent user confusion
3. **Use smoke tests** before deployments
4. **Check test reports** for patterns in failures
5. **Update tests** when adding new features

## Test Data

Tests use:
- Test tenant: `test-plumbing` (automatically created)
- Mock data from your seed scripts
- API responses from your development server

## Reporting Issues

When tests fail, include:
1. Test command that failed
2. Error message from console
3. Screenshot (if available)
4. Steps to reproduce
5. Expected vs actual behavior