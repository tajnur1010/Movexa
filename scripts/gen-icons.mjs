#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Movexa — app icon + splash generator
//
// Rasterises the brand "aperture" mark (same glyph as the site header Logo)
// onto the app's dark cinema surface, writing the PNG source files that
// @capacitor/assets consumes:
//
//   assets/icon-only.png        1024²  full icon (dark bg + glyph)
//   assets/icon-foreground.png  1024²  glyph on transparent (adaptive layer)
//   assets/icon-background.png  1024²  dark surface (adaptive layer)
//   assets/splash.png           2732²  centred glyph on dark surface
//   assets/splash-dark.png      2732²  same (dark theme)
//
// Runs in CI (see .github/workflows/android.yml) and locally via
// `npm run app:icons`. Uses sharp (a devDependency) so it needs no system
// image tools. Failing here never breaks the APK — the workflow step is
// continue-on-error and Capacitor falls back to its default icon.
// ─────────────────────────────────────────────────────────────

import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'assets')
mkdirSync(OUT, { recursive: true })

const GRAD = `
  <linearGradient id="mv" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffb23d"/>
    <stop offset="0.55" stop-color="#ff6a3d"/>
    <stop offset="1" stop-color="#ff5d5d"/>
  </linearGradient>`

// The brand aperture, defined in native 24×24 units (identical proportions to
// the header Logo), scaled to width `w` and centred at (cx, cy).
function glyph(cx, cy, w) {
  const s = w / 24
  const tx = cx - 12 * s
  const ty = cy - 12 * s
  return `
    <g filter="url(#glow)">
      <g transform="translate(${tx} ${ty}) scale(${s})" fill="none" stroke="url(#mv)"
         stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="1.5" y="6.5" width="21" height="11" rx="2.5"/>
        <path d="M7.5 10.5v3M16.5 10.5v3"/>
      </g>
      <g transform="translate(${tx} ${ty}) scale(${s})">
        <circle cx="12" cy="12" r="2.2" fill="url(#mv)"/>
      </g>
    </g>`
}

function doc(size, inner, { transparent = false } = {}) {
  const std = Math.max(2, Math.round(size * 0.018))
  const surface = transparent
    ? ''
    : `<rect width="${size}" height="${size}" fill="#0b0d13"/>
       <rect width="${size}" height="${size}" fill="url(#bgGlow)"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      ${GRAD}
      <radialGradient id="bgGlow" cx="0.5" cy="0.12" r="0.95">
        <stop offset="0" stop-color="#ff8a3d" stop-opacity="0.22"/>
        <stop offset="0.5" stop-color="#ff5d5d" stop-opacity="0.05"/>
        <stop offset="1" stop-color="#0b0d13" stop-opacity="0"/>
      </radialGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="0" stdDeviation="${std}" flood-color="#ff7a3d" flood-opacity="0.5"/>
      </filter>
    </defs>
    ${surface}
    ${inner}
  </svg>`
}

async function png(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(join(OUT, file))
  console.log(`  → assets/${file}`)
}

async function main() {
  console.log('Movexa icons · rasterising brand mark')
  await png(doc(1024, glyph(512, 512, 600)), 1024, 'icon-only.png')
  await png(doc(1024, glyph(512, 512, 470), { transparent: true }), 1024, 'icon-foreground.png')
  await png(doc(1024, ''), 1024, 'icon-background.png')
  await png(doc(2732, glyph(1366, 1366, 860)), 2732, 'splash.png')
  await png(doc(2732, glyph(1366, 1366, 860)), 2732, 'splash-dark.png')
  console.log('Done · 5 assets written')
}

main().catch(err => {
  console.error(`! Icon generation failed: ${err?.message || err}`)
  process.exit(1)
})
