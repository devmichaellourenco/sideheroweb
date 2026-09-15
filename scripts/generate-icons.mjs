import { access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const sourceLogo = join(root, 'public', 'logo.png');
const outDir = join(root, 'src', 'presentation', 'icons');

const SIZES = [16, 48, 128];

/** Fundo alinhado ao tema do painel (--bg). */
const BACKGROUND = { r: 26, g: 26, b: 46, alpha: 1 };

async function generateIcons() {
  try {
    await access(sourceLogo, constants.R_OK);
  } catch {
    console.error('Logo não encontrado em public/logo.png');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });

  for (const size of SIZES) {
    await sharp(sourceLogo)
      .resize(size, size, {
        fit: 'contain',
        background: BACKGROUND,
      })
      .png()
      .toFile(join(outDir, `icon-${size}.png`));
  }

  console.log('Ícones gerados a partir de public/logo.png em src/presentation/icons/');
}

generateIcons().catch((error) => {
  console.error(error);
  process.exit(1);
});
