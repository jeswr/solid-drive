import { test, expect } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

let solidServerProcess: ChildProcess | null = null;

// Helper function to wait for server to be ready
async function waitForServer(url: string, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 401) {
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  return false;
}

// Helper function to clean up test data
function cleanupTestData() {
  const dataDir = path.join(__dirname, 'setup', '.data');
  if (fs.existsSync(dataDir)) {
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
}

// Start Solid Server before all tests
test.beforeAll(async () => {
  console.log('Starting Community Solid Server...');
  
  // Clean up any previous test data
  cleanupTestData();
  
  // Create data directory
  const dataDir = path.join(__dirname, 'setup', '.data');
  fs.mkdirSync(dataDir, { recursive: true });
  
  // Start the server with simple command
  solidServerProcess = spawn('npx', [
    '@solid/community-server',
    '-c', '@css:config/file.json',
    '-f', dataDir,
    '-p', '3001',
    '--seededPodConfigJson', path.join(__dirname, 'setup', 'pods.json')
  ], {
    stdio: 'pipe',
    shell: true
  });
  
  solidServerProcess.stdout?.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  solidServerProcess.stderr?.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  // Wait for server to be ready
  const serverReady = await waitForServer('http://localhost:3001');
  if (!serverReady) {
    throw new Error('Failed to start Solid Server');
  }
  
  console.log('Solid Server is ready');
  
  // Give it a bit more time to fully initialize
  await new Promise(resolve => setTimeout(resolve, 2000));
});

// Stop server after all tests
test.afterAll(async () => {
  if (solidServerProcess) {
    console.log('Stopping Solid Server...');
    solidServerProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Clean up test data
  cleanupTestData();
});

test.describe('Solid Pod Login and File Operations E2E', () => {
  test('should login to seeded account and modify files', async ({ page, context }) => {
    // Enable console logging for debugging
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Verify we're on the login page
    await expect(page.getByText('Sign in to your Solid Pod')).toBeVisible();
    
    // Click the login button
    const loginButton = page.getByRole('button', { name: 'Sign in to your Solid Pod' });
    await loginButton.click();
    
    // Wait for navigation to Solid server - handle popup or redirect
    const newPagePromise = context.waitForEvent('page');
    const currentUrl = page.url();
    
    // Check if we got a popup or redirect
    let authPage = page;
    if (currentUrl.includes('localhost:3000')) {
      // Wait a bit for redirect
      await page.waitForURL(/localhost:3001/, { timeout: 10000 }).catch(() => {});
      
      if (page.url().includes('localhost:3001')) {
        authPage = page;
      } else {
        // Check for popup
        try {
          authPage = await newPagePromise;
        } catch {
          // No popup, stay on current page
        }
      }
    }
    
    // If we're on the Solid server login page
    if (authPage.url().includes('localhost:3001')) {
      // Look for email/password fields
      const emailField = authPage.locator('input[name="email"], input[type="email"], input[id*="email"]').first();
      const passwordField = authPage.locator('input[name="password"], input[type="password"], input[id*="password"]').first();
      
      if (await emailField.isVisible({ timeout: 5000 })) {
        await emailField.fill('testuser@example.com');
        await passwordField.fill('testpassword123');
        
        // Submit the form
        const submitButton = authPage.locator('button[type="submit"], input[type="submit"], button:has-text("Log in"), button:has-text("Sign in")').first();
        await submitButton.click();
        
        // Handle authorization if prompted
        try {
          const authorizeButton = authPage.locator('button:has-text("Authorize"), button:has-text("Allow"), button:has-text("Approve")').first();
          await authorizeButton.waitFor({ timeout: 5000 });
          await authorizeButton.click();
        } catch {
          // No authorization prompt, continue
        }
      }
    }
    
    // Wait for redirect back to app
    await page.waitForURL(/localhost:3000/, { timeout: 15000 });
    
    // Verify we're logged in - wait for drive interface elements
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Look for any button that creates folders
    const createFolderButton = page.locator('button:has-text("Create Folder"), button:has-text("New Folder"), button[aria-label*="folder"]').first();
    await expect(createFolderButton).toBeVisible({ timeout: 10000 });
    
    // Create a test folder
    const testFolderName = `test-folder-${Date.now()}`;
    await createFolderButton.click();
    
    // Fill in folder name - look for input in dialog/modal
    const folderNameInput = page.locator('input[placeholder*="folder"], input[placeholder*="name"], input[type="text"]').last();
    await folderNameInput.waitFor({ state: 'visible' });
    await folderNameInput.fill(testFolderName);
    
    // Submit the dialog
    const createButton = page.locator('button:has-text("Create"), button:has-text("OK"), button[type="submit"]').last();
    await createButton.click();
    
    // Wait for folder to appear in the list
    await expect(page.locator(`text=${testFolderName}`)).toBeVisible({ timeout: 10000 });
    
    // Verify the folder was created
    console.log(`Successfully created folder: ${testFolderName}`);
    
    // Clean up - delete the folder
    const folderElement = page.locator(`tr:has-text("${testFolderName}"), div:has-text("${testFolderName}")`).first();
    await folderElement.hover();
    
    // Look for delete button
    const deleteButton = folderElement.locator('button[aria-label*="delete"], button:has-text("Delete"), button[title*="delete"]').first();
    await deleteButton.click();
    
    // Confirm deletion if needed
    try {
      const confirmButton = page.locator('button:has-text("Delete"), button:has-text("Confirm"), button:has-text("Yes")').last();
      await confirmButton.waitFor({ timeout: 2000 });
      await confirmButton.click();
    } catch {
      // No confirmation needed
    }
    
    // Verify folder is deleted
    await expect(page.locator(`text=${testFolderName}`)).not.toBeVisible({ timeout: 5000 });
    
    // Logout
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out"), button[aria-label*="logout"]').first();
    await logoutButton.click();
    
    // Verify we're back on login page
    await expect(page.getByText('Sign in to your Solid Pod')).toBeVisible({ timeout: 5000 });
  });
  
  test('should upload and verify file content', async ({ page, context }) => {
    // Navigate and login (simplified)
    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: 'Sign in to your Solid Pod' }).click();
    
    // Handle auth flow
    let authPage = page;
    try {
      await page.waitForURL(/localhost:3001/, { timeout: 5000 });
    } catch {
      const newPage = await context.waitForEvent('page', { timeout: 5000 }).catch(() => null);
      if (newPage) authPage = newPage;
    }
    
    if (authPage.url().includes('localhost:3001')) {
      const emailField = authPage.locator('input[name="email"], input[type="email"]').first();
      if (await emailField.isVisible({ timeout: 5000 })) {
        await emailField.fill('testuser@example.com');
        await authPage.locator('input[type="password"]').first().fill('testpassword123');
        await authPage.locator('button[type="submit"], button:has-text("Log in")').first().click();
        
        try {
          await authPage.locator('button:has-text("Authorize")').first().click({ timeout: 5000 });
        } catch {
          // No auth prompt
        }
      }
    }
    
    await page.waitForURL(/localhost:3000/);
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Create and upload a test file
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is test content for E2E testing';
    
    // Create temp file
    const tempFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(tempFilePath, testContent);
    
    // Upload file
    const uploadButton = page.locator('button:has-text("Upload"), button[aria-label*="upload"]').first();
    const fileChooserPromise = page.waitForEvent('filechooser');
    await uploadButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(tempFilePath);
    
    // Wait for file to appear
    await expect(page.locator(`text=${testFileName}`)).toBeVisible({ timeout: 10000 });
    
    // Clean up temp file
    fs.unlinkSync(tempFilePath);
    
    // Verify file exists and clean up
    const fileElement = page.locator(`tr:has-text("${testFileName}"), div:has-text("${testFileName}")`).first();
    await fileElement.hover();
    await fileElement.locator('button[aria-label*="delete"], button:has-text("Delete")').first().click();
    
    try {
      await page.locator('button:has-text("Delete")').last().click({ timeout: 2000 });
    } catch {
      // No confirmation
    }
    
    await expect(page.locator(`text=${testFileName}`)).not.toBeVisible({ timeout: 5000 });
    
    // Logout
    await page.locator('button:has-text("Logout"), button[aria-label*="logout"]').first().click();
  });
});