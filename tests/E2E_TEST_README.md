# End-to-End Testing with Solid Pod Login

This directory contains end-to-end tests that verify login functionality and file operations on a Community Solid Server Pod.

## Overview

The E2E tests use:
- Playwright for browser automation
- Community Solid Server with seeded test accounts
- Actual authentication flow (not mocked)
- Real file operations on the Pod

## Test Account

The tests use a pre-seeded account:
- **Email**: testuser@example.com
- **Password**: testpassword123
- **WebID**: http://localhost:3001/testuser/profile/card#me

## Running the Tests

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the E2E tests:
   ```bash
   npm run test:e2e
   ```

   Or with headed mode to see the browser:
   ```bash
   npm run test:e2e:headed
   ```

3. To start the Solid server manually (for debugging):
   ```bash
   npm run solid:start
   ```

## What the Tests Do

1. **Login Test**: 
   - Starts a Community Solid Server
   - Navigates to the app
   - Performs actual OAuth login flow
   - Creates folders and uploads files
   - Verifies the files exist
   - Cleans up test data

2. **File Verification Test**:
   - Creates files through the UI
   - Verifies they exist on the Pod via API
   - Ensures changes are persisted

3. **Content Verification Test**:
   - Uploads files with specific content
   - Verifies the content is correctly stored

## Test Structure

```
tests/
├── solid-login-e2e.spec.ts    # Main E2E test file
└── setup/
    ├── start-solid-server.js   # Server startup script
    ├── server-config.json      # CSS configuration
    ├── pods.json              # Seeded account configuration
    └── .data/                 # Test data (gitignored)
```

## Troubleshooting

- If tests fail, check that ports 3000 and 3001 are available
- The server data is cleaned up after each test run
- Check console output for server startup errors
- Use headed mode to see what's happening in the browser

## Notes

- The Community Solid Server runs on http://localhost:3001
- The Next.js app runs on http://localhost:3000
- Test data is stored in `tests/setup/.data` and is automatically cleaned up
- The server is started/stopped automatically for each test run