import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, 'dist');
const distExists = existsSync(distDir);

if (distExists) {
  console.log('📦 Found dist folder. Starting production server...\n');
  const server = spawn('node', ['server.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  server.on('error', (error) => {
    console.error('Error starting server:', error);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  console.log('📦 dist folder not found. Starting Vite dev server...\n');
  console.log('💡 This will run directly from source code with hot reload.\n');
  
  const vite = spawn('npx', ['vite'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  vite.on('error', (error) => {
    console.error('Error starting Vite:', error);
    process.exit(1);
  });
  
  vite.on('exit', (code) => {
    process.exit(code || 0);
  });
}




