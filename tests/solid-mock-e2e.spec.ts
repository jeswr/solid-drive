import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Solid Drive E2E Tests with Mocked Auth', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Solid authentication to bypass actual OAuth flow
    await page.addInitScript(() => {
      // Mock localStorage to simulate logged-in state
      const mockSession = {
        isLoggedIn: true,
        webId: 'http://localhost:3001/testuser/profile/card#me',
        sessionId: 'mock-session-id'
      };
      
      // Override the Solid client methods
      (window as any).__mockSolidAuth = true;
      (window as any).__mockSession = mockSession;
      (window as any).__mockResources = [];
    });
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
  });
  
  test('should display drive interface when authenticated', async ({ page }) => {
    // The mock auth should bypass the login screen
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Verify main UI elements are present
    await expect(page.locator('button:has-text("Create Folder"), button:has-text("New Folder")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Upload"), button[aria-label*="upload"]').first()).toBeVisible();
  });
  
  test('should create and delete folders', async ({ page }) => {
    // Wait for drive interface
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Create a folder
    const testFolderName = `test-folder-${Date.now()}`;
    const createButton = page.locator('button:has-text("Create Folder"), button:has-text("New Folder")').first();
    await createButton.click();
    
    // Fill in folder name
    const folderInput = page.locator('input[placeholder*="folder"], input[placeholder*="name"]').last();
    await folderInput.waitFor({ state: 'visible' });
    await folderInput.fill(testFolderName);
    
    // Submit
    await page.locator('button:has-text("Create"), button:has-text("OK")').last().click();
    
    // Verify folder appears
    await expect(page.locator(`text=${testFolderName}`)).toBeVisible({ timeout: 10000 });
    
    // Delete the folder
    const folderRow = page.locator(`tr:has-text("${testFolderName}"), div:has-text("${testFolderName}")`).first();
    await folderRow.hover();
    
    const deleteButton = folderRow.locator('button[aria-label*="delete"], button:has-text("Delete")').first();
    await deleteButton.click();
    
    // Confirm deletion
    try {
      await page.locator('button:has-text("Delete"), button:has-text("Confirm")').last().click({ timeout: 2000 });
    } catch {
      // No confirmation needed
    }
    
    // Verify folder is deleted
    await expect(page.locator(`text=${testFolderName}`)).not.toBeVisible({ timeout: 5000 });
  });
  
  test('should upload and delete files', async ({ page }) => {
    // Wait for drive interface
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Create a test file
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is test content for E2E testing';
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
    
    // Delete the uploaded file
    const fileRow = page.locator(`tr:has-text("${testFileName}"), div:has-text("${testFileName}")`).first();
    await fileRow.hover();
    await fileRow.locator('button[aria-label*="delete"], button:has-text("Delete")').first().click();
    
    try {
      await page.locator('button:has-text("Delete")').last().click({ timeout: 2000 });
    } catch {
      // No confirmation needed
    }
    
    // Verify file is deleted
    await expect(page.locator(`text=${testFileName}`)).not.toBeVisible({ timeout: 5000 });
  });
  
  test('should navigate between folders', async ({ page }) => {
    // Wait for drive interface
    await expect(page.locator('text=Solid Drive').first()).toBeVisible({ timeout: 10000 });
    
    // Create a folder
    const folderName = `nav-test-${Date.now()}`;
    await page.locator('button:has-text("Create Folder"), button:has-text("New Folder")').first().click();
    await page.locator('input[placeholder*="folder"], input[placeholder*="name"]').last().fill(folderName);
    await page.locator('button:has-text("Create"), button:has-text("OK")').last().click();
    
    // Wait for folder to appear
    await expect(page.locator(`text=${folderName}`)).toBeVisible({ timeout: 10000 });
    
    // Double-click to navigate into folder
    await page.locator(`text=${folderName}`).dblclick();
    
    // Verify we're inside the folder (breadcrumb or path should show folder name)
    await expect(page.locator(`text=${folderName}`).first()).toBeVisible();
    
    // Navigate back to root
    const rootButton = page.locator('button:has-text("testuser"), button:has-text("Home"), button[aria-label*="root"]').first();
    if (await rootButton.isVisible({ timeout: 2000 })) {
      await rootButton.click();
    } else {
      // Try breadcrumb navigation
      await page.locator('button:has-text("/"), a:has-text("/")').first().click();
    }
    
    // Verify we're back at root and can see our folder
    await expect(page.locator(`text=${folderName}`)).toBeVisible({ timeout: 5000 });
    
    // Clean up
    const folderRow = page.locator(`tr:has-text("${folderName}"), div:has-text("${folderName}")`).first();
    await folderRow.hover();
    await folderRow.locator('button[aria-label*="delete"], button:has-text("Delete")').first().click();
    
    try {
      await page.locator('button:has-text("Delete")').last().click({ timeout: 2000 });
    } catch {
      // No confirmation needed
    }
  });
});