import { execSync } from 'node:child_process';
import { rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const reactAppDir = resolve(projectRoot, 'react-app');
const publicReactDir = resolve(projectRoot, 'public', 'react');
const distDir = resolve(reactAppDir, 'dist');

console.log('Ensuring React SPA dependencies are installed...');
if (!existsSync(resolve(reactAppDir, 'node_modules', 'vite'))) {
  console.log('Installing react-app dependencies...');
  execSync('npm install', { cwd: reactAppDir, stdio: 'inherit' });
}

console.log('Building React SPA...');
execSync('npm run build', { cwd: reactAppDir, stdio: 'inherit' });

if (existsSync(publicReactDir)) {
  rmSync(publicReactDir, { recursive: true, force: true });
}
mkdirSync(publicReactDir, { recursive: true });

if (existsSync(distDir)) {
  cpSync(distDir, publicReactDir, { recursive: true });
  console.log('Copied react-app/dist to public/react successfully.');
} else {
  console.error('react-app/dist does not exist after build!');
  process.exit(1);
}
