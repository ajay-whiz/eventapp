import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { generateProductionConfig } from './generate-production-config.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const mainPath = join(rootDir, 'dist', 'main.js');

function ensureUploadDirectories() {
  const uploadDirs = [
    join(rootDir, 'uploads', 'images'),
    join(rootDir, 'uploads', 'forms'),
    join(rootDir, 'uploads', 'profile'),
    join(rootDir, 'uploads', 'venues'),
    join(rootDir, 'uploads', 'vendors'),
    join(rootDir, 'uploads', 'quotation'),
    join(rootDir, 'uploads', 'booking'),
  ];

  for (const dir of uploadDirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

ensureUploadDirectories();
generateProductionConfig();

if (!existsSync(mainPath)) {
  console.error(`Build output not found at ${mainPath}`);
  process.exit(1);
}

console.log('Starting NestJS application...');

const child = spawn(process.execPath, [mainPath], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
