const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create .data directory if it doesn't exist
const dataDir = path.join(__dirname, '.data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Start the Community Solid Server with seeded configuration
const serverProcess = spawn('npx', [
  '@solid/community-server',
  '--config', path.join(__dirname, 'server-config.json'),
  '--port', '3001',
  '--rootFilePath', dataDir,
  '--seededPodConfigJson', path.join(__dirname, 'pods.json')
], {
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

console.log('Starting Community Solid Server on http://localhost:3001');
console.log('Test user credentials:');
console.log('  Email: testuser@example.com');
console.log('  Password: testpassword123');
console.log('  WebID: http://localhost:3001/testuser/profile/card#me');