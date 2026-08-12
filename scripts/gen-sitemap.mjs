#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Movexa dynamic sitemap generator
//
// Runs automatically AFTER `vite build` (via the `postbuild` npm hook), so it
// executes on Vercel at deploy time — no local Node needed.
//
// What it does: pulls the titles Movexa actually surfaces (global popular /
// top-rated / now-playing / trending, plus every category "world" from
// src/data/worlds.js) and writes one sitemap per media type, tied together by
// a sitemap index at /sitemap.xml — the URL robots.txt already advertises.
//
// Design rules:
//   • Zero dependencies. Node 18+ global fetch only.
//   • Single source of truth: the TMDB key and the category filters are
//     IMPORTED from the app, never re-declared here. Change a world in
//     worlds.js and the sitemap follows automatically.
//   • Never break the build. Any failure logs a warning and exits 0, leaving
//     the static public/sitemap.xml fallback in place.
//   • No invented freshness. Title URLs carry no <lastmod>, because we have no
//     honest signal for when a detail page's content last changed. Faking it
//     across thousands of URLs is exactly what makes Google distrust a sitemap.
// ─────────────────────────────────────────────────────────────

import { writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { TMDB_KEY } from '../src/lib/api.js'
import { WORLDS, WORLD_ORDER } from '../src/data/worlds.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = resolve(ROOT, 'dist')

// Override either of these in Vercel's env vars when the custom domain lands.
const ORIGIN = (process.env.SITE_ORIGIN || 'https://movexa-sigma.vercel.app').replace(/\/+$/, '')
const KEY = process.env.TMDB_KEY || TMDB_KEY

const API = 'https://api.themoviedb.org/3'
const CONCURRENCY = 8        // well under TMDB's ~50 req/sec allowance
const MAX_RETRIES = 2
const MAX_TMDB_PAGE = 500    // TMDB refuses paging past this
const URLS_PER_FILE = 20000  // spec allows 50k; smaller files are easier to debug

// How deep to page each source. 20 results per page.
const GLOBAL_SOURCES = [
  { path: '/movie/popular',      type: 'movie', pages: 25 },
  { path: '/tv/popular',         type: 'tv',    pages: 25 },
  { path: '/movie/top_rated',    type: 'movie', pages: 15 },
  { path: '/tv/top_rated',       type: 'tv',    pages: 15 },
  { path: '/movie/now_playing',  type: 'movie', pages: 10 },
  { path: '/tv/airing_today',    type: 'tv',    pages: 5 },
  { path: '/trending/movie/week', type: 'movie', pages: 1 },
  { path: '/trending/tv/week',   type: 'tv',    pages: 1 },
]
const REGIONAL_PAGES = 14

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// ── TMDB fetch, with retry on rate-limit / transient failure ──
async function tmdb(path, params = {}) {
  const url = new URL(API + path)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
  }
  url.searchParams.set('api_key', KEY)

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      if (res.status === 429) { await sleep(1000 * (attempt + 1)); continue }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.warn(`  ! skipped ${path} (${params.page ? `page ${params.page}, ` : ''}${err.message})`)
        return null
      }
      await sleep(400 * (attempt + 1))
    }
  }
  return null
}

// Run async tasks with a bounded worker pool.
async function pool(tasks, limit = CONCURRENCY) {
  const out = []
  let next = 0
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (next < tasks.length) {
      const i = next++
      out[i] = await tasks[i]()
    }
  })
  await Promise.all(workers)
  return out
}

// ── Collection ────────────────────────────────────────────────
const seen = new Set()          // "type:id" — dedupes across overlapping sources
const ids = { movie: [], tv: [] }

// Quality gate: a detail page with no poster and no date is a thin page, and
// thin pages dilute the whole site's crawl quality. Adult titles are excluded.
function add(item, type) {
  if (!item || !item.id || item.adult) return
  if (!item.poster_path) return
  if (!(item.release_date || item.first_air_date)) return
  const key = `${type}:${item.id}`
  if (seen.has(key)) return
  seen.add(key)
  ids[type].push(item.id)
}

// Page 1 tells us how many pages actually exist, so we never burn calls on
// empty pages — this matters for the smaller regional catalogues (bn, te, ta).
async function collect(path, params, maxPages, type) {
  const first = await tmdb(path, { ...params, page: 1 })
  if (!first) return
  for (const r of first.results || []) add(r, type)

  const last = Math.min(maxPages, first.total_pages || 1, MAX_TMDB_PAGE)
  if (last < 2) return

  const tasks = []
  for (let p = 2; p <= last; p++) tasks.push(() => tmdb(path, { ...params, page: p }))
  for (const page of await pool(tasks)) {
    for (const r of page?.results || []) add(r, type)
  }
}

// ── XML ───────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function urlset(entries) {
  const body = entries.map(e => {
    const parts = [`    <loc>${esc(e.loc)}</loc>`]
    if (e.lastmod) parts.push(`    <lastmod>${e.lastmod}</lastmod>`)
    if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`)
    if (e.priority) parts.push(`    <priority>${e.priority}</priority>`)
    return `  <url>\n${parts.join('\n')}\n  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

function sitemapIndex(files, lastmod) {
  const body = files.map(f =>
    `  <sitemap>\n    <loc>${esc(`${ORIGIN}/${f}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`
  ).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

function write(file, xml) {
  writeFileSync(join(OUT_DIR, file), xml, 'utf8')
  console.log(`  → ${file}`)
}

// Split a type's ids across as many files as the per-file cap requires.
function writeTitleSitemaps(type, list) {
  if (list.length === 0) return []
  const files = []
  const chunks = Math.ceil(list.length / URLS_PER_FILE)
  for (let i = 0; i < chunks; i++) {
    const slice = list.slice(i * URLS_PER_FILE, (i + 1) * URLS_PER_FILE)
    const file = chunks > 1 ? `sitemap-${type}-${i + 1}.xml` : `sitemap-${type}.xml`
    write(file, urlset(slice.map(id => ({ loc: `${ORIGIN}/${type}/${id}` }))))
    files.push(file)
  }
  return files
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  const today = new Date().toISOString().slice(0, 10)
  console.log(`Movexa sitemap · origin ${ORIGIN}`)

  if (!KEY) {
    console.warn('! No TMDB key available — keeping the static sitemap.xml fallback.')
    return
  }
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true })

  // Global lists
  for (const src of GLOBAL_SOURCES) {
    await collect(src.path, {}, src.pages, src.type)
  }
  console.log(`  global   → ${ids.movie.length} movies, ${ids.tv.length} tv`)

  // Category worlds — filters come straight from src/data/worlds.js
  for (const key of WORLD_ORDER) {
    const world = WORLDS[key]
    if (!world) continue
    for (const type of world.types || []) {
      if (type !== 'movie' && type !== 'tv') continue
      const path = type === 'tv' ? '/discover/tv' : '/discover/movie'
      await collect(path, { ...world.base, sort_by: 'popularity.desc' }, REGIONAL_PAGES, type)
    }
  }

  const total = ids.movie.length + ids.tv.length
  console.log(`  combined → ${ids.movie.length} movies, ${ids.tv.length} tv (${total} unique)`)

  // A total wipeout means TMDB was unreachable. Overwriting a good sitemap with
  // an empty one would actively hurt indexing, so bail and keep the fallback.
  if (total === 0) {
    console.warn('! No titles fetched — keeping the static sitemap.xml fallback.')
    return
  }

  // Static, hand-known pages. These DO get a lastmod: the build date is an
  // honest answer for "when did this listing last change".
  const pages = [
    { loc: `${ORIGIN}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    ...WORLD_ORDER.map(w => ({
      loc: `${ORIGIN}/browse/${w}`, lastmod: today, changefreq: 'daily', priority: '0.8',
    })),
  ]
  write('sitemap-pages.xml', urlset(pages))

  const files = [
    'sitemap-pages.xml',
    ...writeTitleSitemaps('movie', ids.movie),
    ...writeTitleSitemaps('tv', ids.tv),
  ]

  // /sitemap.xml becomes the index — the single URL robots.txt points at.
  write('sitemap.xml', sitemapIndex(files, today))
  console.log(`Done · ${pages.length + total} URLs across ${files.length + 1} files`)
}

main().catch(err => {
  // Never fail the deploy over a sitemap.
  console.warn(`! Sitemap generation failed, keeping fallback: ${err?.message || err}`)
  process.exit(0)
})
