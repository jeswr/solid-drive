import { test as base } from '@playwright/test';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { setTimeout } from 'timers';

const sleep = promisify(setTimeout);

export interface SolidServerFixture {
  serverUrl: string;
  stopServer: () => Promise<void>;
}

export const test = base.extend<SolidServerFixture>({
  serverUrl: ['http://localhost:3001', { option: true }],
  stopServer: [async ({}, use) => {
    let serverProcess: any = null;
    
    await use(async () => {
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
        await sleep(1000);
      }
    });
    
    // Start the Community Solid Server
    serverProcess = spawn('npx', ['@solid/community-server', '--port', '3001'], {
      stdio: 'pipe',
      shell: true,
    });
    
    // Wait for server to start
    await sleep(3000);
    
    // Cleanup on test end
    test.afterAll(async () => {
      if (serverProcess) {
        serverProcess.kill('SIGTERM');
      }
    });
  }, { scope: 'test' }],
});

export { expect } from '@playwright/test';