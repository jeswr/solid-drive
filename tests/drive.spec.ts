import { test, expect } from '@playwright/test';

test.describe('Solid Drive Interface', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should show login page when not authenticated', async ({ page }) => {
    // Check that the login page is displayed
    await expect(page.getByText('Solid Drive')).toBeVisible();
    await expect(page.getByText('Sign in to your Solid Pod')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in to your Solid Pod' })).toBeVisible();
  });

  test('should display login form with proper elements', async ({ page }) => {
    // Check for login form elements
    await expect(page.getByText('A modern file management interface for Solid Pods')).toBeVisible();
    await expect(page.getByText("Don't have a Solid Pod?")).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get one here' })).toBeVisible();
  });

  test('should have proper navigation links', async ({ page }) => {
    // Check external link to Solid Pod
    const solidLink = page.getByRole('link', { name: 'Get one here' });
    await expect(solidLink).toHaveAttribute('href', 'https://solidproject.org/users/get-a-pod');
    await expect(solidLink).toHaveAttribute('target', '_blank');
  });
});

test.describe('Drive Interface (Authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      // Mock Solid client authentication
      window.mockSolidAuth = {
        isLoggedIn: () => true,
        getWebId: () => 'https://test.pod.example/profile/card#me',
        initialize: () => Promise.resolve(),
        login: () => Promise.resolve(),
        logout: () => Promise.resolve(),
      };
    });

    await page.goto('/');
  });

  test('should show drive interface when authenticated', async ({ page }) => {
    // Wait for the drive interface to load
    await expect(page.getByText('Solid Drive')).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Folder' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  });

  test('should display toolbar with search and view options', async ({ page }) => {
    // Check search functionality
    await expect(page.getByPlaceholder('Search files and folders...')).toBeVisible();
    
    // Check view mode buttons
    await expect(page.getByRole('button', { name: '' })).toBeVisible(); // Grid view
    await expect(page.getByRole('button', { name: '' })).toBeVisible(); // List view
  });

  test('should show breadcrumb navigation', async ({ page }) => {
    // Check breadcrumb is present
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle file upload', async ({ page }) => {
    // Mock file upload
    await page.setInputFiles('input[type="file"]', {
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello, World!'),
    });

    // Check that upload button is present
    await expect(page.getByRole('button', { name: 'Upload' })).toBeVisible();
  });

  test('should handle folder creation', async ({ page }) => {
    // Mock prompt dialog
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('Test Folder');
    });

    // Click new folder button
    await page.getByRole('button', { name: 'New Folder' }).click();
    
    // Check that the dialog was handled
    await expect(page.getByText('Test Folder')).toBeVisible();
  });

  test('should display empty state when no files', async ({ page }) => {
    // Mock empty file list
    await page.addInitScript(() => {
      window.mockSolidResources = [];
    });

    await page.reload();
    
    // Check empty state message
    await expect(page.getByText('This folder is empty.')).toBeVisible();
  });

  test('should handle file selection', async ({ page }) => {
    // Mock file list
    await page.addInitScript(() => {
      window.mockSolidResources = [
        {
          url: 'https://test.pod.example/file1.txt',
          name: 'test1.txt',
          type: 'file',
          size: 1024,
          lastModified: new Date(),
        },
        {
          url: 'https://test.pod.example/folder1/',
          name: 'folder1',
          type: 'folder',
        },
      ];
    });

    await page.reload();
    
    // Check that files are displayed
    await expect(page.getByText('test1.txt')).toBeVisible();
    await expect(page.getByText('folder1')).toBeVisible();
  });

  test('should handle file deletion', async ({ page }) => {
    // Mock confirmation dialog
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // Mock file with delete option
    await page.addInitScript(() => {
      window.mockSolidResources = [
        {
          url: 'https://test.pod.example/file1.txt',
          name: 'test1.txt',
          type: 'file',
        },
      ];
    });

    await page.reload();
    
    // Click on file to show menu
    await page.getByText('test1.txt').click();
    
    // Check that delete option is available
    await expect(page.getByText('Delete')).toBeVisible();
  });

  test('should handle sharing functionality', async ({ page }) => {
    // Mock file with share option
    await page.addInitScript(() => {
      window.mockSolidResources = [
        {
          url: 'https://test.pod.example/file1.txt',
          name: 'test1.txt',
          type: 'file',
        },
      ];
    });

    await page.reload();
    
    // Click on file to show menu
    await page.getByText('test1.txt').click();
    
    // Check that share option is available
    await expect(page.getByText('Share')).toBeVisible();
  });

  test('should display user information in header', async ({ page }) => {
    // Check user info is displayed
    await expect(page.getByText('test.pod.example')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
  });

  test('should handle logout', async ({ page }) => {
    // Click sign out button
    await page.getByRole('button', { name: 'Sign Out' }).click();
    
    // Should redirect to login page
    await expect(page.getByText('Sign in to your Solid Pod')).toBeVisible();
  });

  test('should handle search functionality', async ({ page }) => {
    // Mock files
    await page.addInitScript(() => {
      window.mockSolidResources = [
        { name: 'document.txt', type: 'file' },
        { name: 'image.jpg', type: 'file' },
        { name: 'folder', type: 'folder' },
      ];
    });

    await page.reload();
    
    // Type in search box
    await page.getByPlaceholder('Search files and folders...').fill('document');
    
    // Should filter results
    await expect(page.getByText('document.txt')).toBeVisible();
    await expect(page.getByText('image.jpg')).not.toBeVisible();
  });

  test('should handle view mode switching', async ({ page }) => {
    // Mock files
    await page.addInitScript(() => {
      window.mockSolidResources = [
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
      ];
    });

    await page.reload();
    
    // Check grid view is active by default
    await expect(page.locator('.grid')).toBeVisible();
    
    // Switch to list view
    await page.getByRole('button').nth(1).click(); // List view button
    
    // Check list view is active
    await expect(page.locator('.grid-cols-1')).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Mock files
    await page.addInitScript(() => {
      window.mockSolidResources = [
        { name: 'file1.txt', type: 'file' },
        { name: 'file2.txt', type: 'file' },
      ];
    });

    await page.reload();
    
    // Focus on first file
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should select the file
    await expect(page.locator('.bg-blue-50')).toBeVisible();
  });

  test('should handle drag and drop upload', async ({ page }) => {
    // Mock file drop
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles({
      name: 'dropped-file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Dropped file content'),
    });
    
    // Check that upload was handled
    await expect(page.getByText('dropped-file.txt')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Mock error state
    await page.addInitScript(() => {
      window.mockSolidError = 'Failed to load resources';
    });

    await page.reload();
    
    // Check error message is displayed
    await expect(page.getByText('Failed to load resources')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock loading state
    await page.addInitScript(() => {
      window.mockSolidLoading = true;
    });

    await page.reload();
    
    // Check loading spinner is displayed
    await expect(page.locator('.animate-spin')).toBeVisible();
  });
});

test.describe('Share Dialog', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state and file
    await page.addInitScript(() => {
      window.mockSolidAuth = {
        isLoggedIn: () => true,
        getWebId: () => 'https://test.pod.example/profile/card#me',
      };
      window.mockSolidResources = [
        { name: 'shared-file.txt', type: 'file' },
      ];
    });

    await page.goto('/');
  });

  test('should open share dialog when share button is clicked', async ({ page }) => {
    // Click on file to show menu
    await page.getByText('shared-file.txt').click();
    
    // Click share button
    await page.getByText('Share').click();
    
    // Check share dialog is displayed
    await expect(page.getByText('Share "shared-file.txt"')).toBeVisible();
  });

  test('should display permission options in share dialog', async ({ page }) => {
    // Open share dialog
    await page.getByText('shared-file.txt').click();
    await page.getByText('Share').click();
    
    // Check permission options
    await expect(page.getByText('Read')).toBeVisible();
    await expect(page.getByText('Write')).toBeVisible();
    await expect(page.getByText('Control')).toBeVisible();
  });

  test('should allow adding new people to share', async ({ page }) => {
    // Open share dialog
    await page.getByText('shared-file.txt').click();
    await page.getByText('Share').click();
    
    // Fill in new person
    await page.getByPlaceholder('Enter email or Web ID').fill('test@example.com');
    
    // Check add button is enabled
    await expect(page.getByRole('button', { name: '' })).toBeEnabled();
  });

  test('should display current permissions', async ({ page }) => {
    // Mock permissions
    await page.addInitScript(() => {
      window.mockSolidPermissions = [
        { agent: 'user@example.com', modes: ['Read', 'Write'] },
      ];
    });

    await page.reload();
    
    // Open share dialog
    await page.getByText('shared-file.txt').click();
    await page.getByText('Share').click();
    
    // Check current permissions are displayed
    await expect(page.getByText('user@example.com')).toBeVisible();
    await expect(page.getByText('Read, Write')).toBeVisible();
  });
});