// One-off: renders PWA icons from public/logo-greeniteso.svg into public/icons/.
// Usage: node scripts/generate-pwa-icons.mjs
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'logo-greeniteso.svg');
const outDir = path.join(root, 'public', 'icons');
const BG = '#6ba439'; // primary-500

await mkdir(outDir, { recursive: true });

/** Logo fitted inside `inner` px, centered on a `size` canvas. */
async function render(file, size, inner, background) {
  const logo = await sharp(src, { density: 600 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(outDir, file));
  console.log('wrote', file);
}

await render('icon-192.png', 192, 184);
await render('icon-512.png', 512, 490);
await render('icon-maskable-512.png', 512, 300, BG); // inside 80% safe zone
await render('apple-touch-icon.png', 180, 120, BG);
