import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');
const releasesDir = join(root, 'releases');

async function readVersion() {
  const packagePath = join(root, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  return pkg.version;
}

async function packRelease() {
  const version = await readVersion();
  const zipName = `side-hero-v${version}.zip`;
  const zipPath = join(releasesDir, zipName);

  console.log('Gerando build HTML5...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });

  await mkdir(releasesDir, { recursive: true });
  await rm(zipPath, { force: true });

  console.log(`Empacotando ${zipName}...`);
  execSync(`zip -r "${zipPath}" . -x "*.map"`, {
    cwd: dist,
    stdio: 'inherit',
  });

  console.log(`\nRelease pronta: releases/${zipName}`);
  console.log('Envie este ZIP no itch.io → HTML → This file will be played in the browser.');
}

packRelease().catch((error) => {
  console.error(error);
  process.exit(1);
});
