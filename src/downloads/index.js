// ─────────────────────────────────────────────────────────────
//  Download links loader.
//  Reads the Google Sheet (published as CSV) named in ./settings.js,
//  parses it once per page load, and answers: "is there a download
//  link for this movie / this episode?".
//
//  If the URL is empty, or the fetch fails (offline / bad sheet / CORS),
//  it simply returns an EMPTY map — no Download button appears and the
//  site keeps working. This feature can never break playback.
//
//  Sheet columns: type, id, season, episode, url
//  Lookup keys:   movie:<id>              e.g. movie:969681
//                 tv:<id>:<season>:<ep>   e.g. tv:1399:1:1
//
//  You never edit links here — links live in the Google Sheet, and the
//  Sheet URL lives in ./settings.js. This file is just the plumbing.
// ─────────────────────────────────────────────────────────────
import { SHEET_CSV_URL } from './settings.js'

// Tiny RFC-4180-ish CSV parser: handles quoted fields, commas inside
// quotes, escaped "" quotes, and CRLF/LF line endings.
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } // escaped quote
        else inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = ''
    } else if (c !== '\r') {
      field += c
    }
  }
  // Flush the trailing field/row (files without a final newline).
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

const clean = (v) => (v == null ? '' : String(v).trim())

// Normalize a number-ish cell to a bare string so "01" and 1 both match:
// "01" -> "1", " 2 " -> "2", "" -> "".
function numCell(v) {
  const s = clean(v)
  if (s === '') return ''
  const n = Number(s)
  return Number.isFinite(n) ? String(n) : s
}

export function movieKey(id) {
  return `movie:${clean(id)}`
}
export function episodeKey(id, season, episode) {
  return `tv:${clean(id)}:${numCell(season)}:${numCell(episode)}`
}

// Turn parsed CSV rows into a Map<key, url>. The first row is the header;
// columns are matched BY NAME (case-insensitive) so column order is flexible.
function buildMap(rows) {
  const map = new Map()
  if (!rows.length) return map

  const header = rows[0].map((h) => clean(h).toLowerCase())
  const col = (name) => header.indexOf(name)
  const ti = col('type')
  const ii = col('id')
  const si = col('season')
  const ei = col('episode')
  const ui = col('url')
  if (ii < 0 || ui < 0) return map // no id/url column → sheet unusable, bail safely

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    if (!cells || !cells.length) continue
    const id = clean(cells[ii])
    const url = clean(cells[ui])
    if (!id || !url) continue // skip blank / incomplete rows

    const type = (ti >= 0 ? clean(cells[ti]) : '').toLowerCase()
    const season = si >= 0 ? cells[si] : ''
    const episode = ei >= 0 ? cells[ei] : ''

    // Explicit type wins; otherwise infer TV from a season+episode pair.
    let isTV
    if (type === 'movie') isTV = false
    else if (type === 'tv') isTV = true
    else isTV = clean(season) !== '' && clean(episode) !== ''

    map.set(isTV ? episodeKey(id, season, episode) : movieKey(id), url)
  }
  return map
}

// Fetch + parse at most once per page load (module-level promise cache).
let cache = null

export function loadDownloads() {
  if (cache) return cache
  const url = clean(SHEET_CSV_URL)
  if (!url) {
    cache = Promise.resolve(new Map()) // feature off until a URL is set
    return cache
  }
  cache = fetch(url)
    .then((res) => (res.ok ? res.text() : ''))
    .then((text) => buildMap(parseCsv(text)))
    .catch(() => new Map()) // network / CORS / parse error → no buttons, no crash
  return cache
}

export function getMovieDownload(map, id) {
  return map ? map.get(movieKey(id)) || null : null
}
export function getEpisodeDownload(map, id, season, episode) {
  return map ? map.get(episodeKey(id, season, episode)) || null : null
}
