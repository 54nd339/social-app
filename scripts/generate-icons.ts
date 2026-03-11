/**
 * Run with: bun scripts/generate-icons.ts
 * Generates placeholder PWA icons for Haven.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

function generateSvgIcon(size: number): string {
  const fontSize = Math.round(size * 0.35);
  const subtitleSize = Math.round(size * 0.08);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.15)}" fill="#7c3aed"/>
  <text x="50%" y="45%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="700"
    font-size="${fontSize}" fill="white">H</text>
  <text x="50%" y="72%" dominant-baseline="central" text-anchor="middle"
    font-family="system-ui, -apple-system, sans-serif" font-weight="500"
    font-size="${subtitleSize}" fill="rgba(255,255,255,0.8)">HAVEN</text>
</svg>`;
}

const outDir = join(process.cwd(), 'public', 'icons');

for (const size of [192, 512]) {
  const svg = generateSvgIcon(size);
  writeFileSync(join(outDir, `icon-${size}.svg`), svg);
}

// eslint-disable-next-line no-console
console.log('Generated SVG icons in public/icons/');
