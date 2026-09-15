import * as esbuild from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { copyAssets } from './copy-assets.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

const watch = process.argv.includes('--watch');

async function writeIndex() {
  const source = await readFile(join(root, 'src/presentation/panel/panel.html'), 'utf8');
  const html = source
    .replace(
      '<title>Side Hero</title>',
      '<title>Side Hero</title>\n    <link rel="icon" href="./icons/icon-48.png" />',
    )
    .replace('href="panel.css"', 'href="./panel.css"')
    .replace('src="panel.js"', 'src="./game.js"');

  await writeFile(join(dist, 'index.html'), html);
}

async function copyStaticAssets() {
  await mkdir(join(dist, 'icons'), { recursive: true });
  await writeIndex();
  await copyFile(join(root, 'src/presentation/panel/panel.css'), join(dist, 'panel.css'));
  await copyFile(join(root, 'src/presentation/icons/icon-16.png'), join(dist, 'icons/icon-16.png'));
  await copyFile(join(root, 'src/presentation/icons/icon-48.png'), join(dist, 'icons/icon-48.png'));
  await copyFile(join(root, 'src/presentation/icons/icon-128.png'), join(dist, 'icons/icon-128.png'));
}

async function build() {
  if (!watch) {
    await rm(dist, { recursive: true, force: true });
  }
  await mkdir(dist, { recursive: true });

  const moduleCtx = await esbuild.context({
    entryPoints: {
      game: join(root, 'src/presentation/panel/panel.ts'),
    },
    outdir: dist,
    bundle: true,
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    logLevel: 'info',
  });

  if (watch) {
    await copyStaticAssets();
    await copyAssets({ outRoot: join(dist, 'assets') });
    await moduleCtx.watch();
    console.log('Watching...');
  } else {
    await moduleCtx.rebuild();
    await copyStaticAssets();
    await copyAssets({ outRoot: join(dist, 'assets') });
    await moduleCtx.dispose();
    console.log('Build concluído em dist/');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
