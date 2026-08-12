// ─────────────────────────────────────────────────────────────
// Movexa — server-side per-title meta injection (Vercel Edge Function)
//
// Vercel rewrites /movie/:id and /tv/:id here (see vercel.json). This handler
// fetches the title's TMDB data, takes the ALREADY-BUILT index.html shell, and
// rewrites its <title> / description / canonical / Open Graph / Twitter tags +
// injects a Movie|TVSeries JSON-LD block — BEFORE the HTML is sent.
//
// Why: social scrapers (Facebook, WhatsApp, X, Telegram) and some crawlers do
// NOT run JavaScript, so the client-side SEO in seo.js never reaches them. This
// gives every title a correct link preview (its own poster/backdrop) and gives
// Google fully-formed HTML without waiting on a JS render pass.
//
// Safety: the React app still boots normally (same hashed asset tags are kept),
// and seo.js updates the same tags client-side to identical values — the server
// tags carry matching ids/selectors so nothing duplicates. Any failure (bad id,
// TMDB down) falls through to the untouched shell, so a detail URL never breaks.
//
// The TMDB key is the same public read key already shipped in the client bundle
// — not a new secret. Override via the TMDB_KEY env var if desired.
// ─────────────────────────────────────────────────────────────

export const config = { runtime: 'edge' }

const TMDB_API = 'https://api.themoviedb.org/3'
const TMDB_KEY = process.env.TMDB_KEY || '24b293c7f17afc27e9b7357dea0e7f8a'
const IMG = 'https://image.tmdb.org/t/p'
const SITE_NAME = 'Movexa'

// ── escaping ──────────────────────────────────────────────────
const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const escHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Replace the value of a <meta name="…" content="…"> / <meta property="…"> tag,
// or a <link rel="canonical" href="…">. If the tag isn't present, HTML is
// returned unchanged (we never inject duplicates).
function setMetaName(html, name, value) {
  return html.replace(
    new RegExp(`(<meta\\s+name="${name}"\\s+content=")[^"]*(")`, 'i'),
    `$1${escAttr(value)}$2`,
  )
}
function setMetaProp(html, prop, value) {
  return html.replace(
    new RegExp(`(<meta\\s+property="${prop}"\\s+content=")[^"]*(")`, 'i'),
    `$1${escAttr(value)}$2`,
  )
}
function setCanonical(html, href) {
  return html.replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/i, `$1${escAttr(href)}$2`)
}
function setTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escHtml(title)}</title>`)
}

// ── build the per-title values from TMDB data ─────────────────
function buildMeta(type, id, d, origin) {
  const isTV = type === 'tv'
  const name = d.title || d.name || SITE_NAME
  const date = d.release_date || d.first_air_date || ''
  const yr = date ? date.slice(0, 4) : ''
  const kind = isTV ? 'TV series' : 'movie'
  const genreNames = (d.genres || []).map((g) => g.name).filter(Boolean)

  const overview = (d.overview || '').trim()
  const fallback =
    `Watch ${name}${yr ? ` (${yr})` : ''}` +
    `${genreNames.length ? `, ${genreNames.slice(0, 3).join(', ')}` : ''} ${kind}, on ${SITE_NAME}.`
  const raw = overview || fallback
  const description = raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw

  const pageTitle = `${name}${yr ? ` (${yr})` : ''} — Watch on ${SITE_NAME}`
  const canonical = `${origin}/${type}/${id}`

  // Wide 16:9 backdrop makes the best summary_large_image card; fall back to
  // the poster, then to the site's default cover.
  let ogImage, ogW, ogH
  if (d.backdrop_path) {
    ogImage = `${IMG}/w1280${d.backdrop_path}`; ogW = 1280; ogH = 720
  } else if (d.poster_path) {
    ogImage = `${IMG}/w780${d.poster_path}`; ogW = 780; ogH = 1170
  } else {
    ogImage = `${origin}/og-cover.svg`; ogW = 1200; ogH = 630
  }

  // JSON-LD — real TMDB fields only, never invented.
  const ld = {
    '@context': 'https://schema.org',
    '@type': isTV ? 'TVSeries' : 'Movie',
    name,
    url: canonical,
  }
  if (overview) ld.description = overview
  if (d.poster_path) ld.image = `${IMG}/w500${d.poster_path}`
  if (date) ld.datePublished = date
  if (genreNames.length) ld.genre = genreNames
  if (d.vote_average > 0 && d.vote_count > 0) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(d.vote_average).toFixed(1),
      ratingCount: d.vote_count,
      bestRating: 10,
      worstRating: 1,
    }
  }

  return { pageTitle, description, canonical, ogImage, ogW, ogH, ld }
}

// Apply the per-title values to the shell HTML.
function inject(html, m) {
  html = setTitle(html, m.pageTitle)
  html = setMetaName(html, 'description', m.description)
  html = setCanonical(html, m.canonical)

  html = setMetaProp(html, 'og:title', m.pageTitle)
  html = setMetaProp(html, 'og:description', m.description)
  html = setMetaProp(html, 'og:url', m.canonical)
  html = setMetaProp(html, 'og:image', m.ogImage)
  html = setMetaProp(html, 'og:image:width', String(m.ogW))
  html = setMetaProp(html, 'og:image:height', String(m.ogH))

  html = setMetaName(html, 'twitter:title', m.pageTitle)
  html = setMetaName(html, 'twitter:description', m.description)
  html = setMetaName(html, 'twitter:image', m.ogImage)

  // Inject the title JSON-LD (id matches seo.js's setJsonLd('title', …) so the
  // client updates this node in place instead of adding a second one). Escaping
  // "<" as < prevents any "</script>" breakout from TMDB text.
  const ldJson = JSON.stringify(m.ld).replace(/</g, '\\u003c')
  const script = `<script type="application/ld+json" id="ld-title">${ldJson}</script>`
  html = html.replace('</head>', `    ${script}\n  </head>`)

  return html
}

export default async function handler(req) {
  const { origin, searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  // The built shell — always the source of truth for current asset hashes.
  // (/index.html is a static file, served before rewrites: no loop.)
  const shellRes = await fetch(`${origin}/index.html`, { headers: { accept: 'text/html' } })
  let html = await shellRes.text()

  if ((type === 'movie' || type === 'tv') && /^\d+$/.test(id || '')) {
    try {
      const r = await fetch(`${TMDB_API}/${type}/${id}?api_key=${TMDB_KEY}`, {
        headers: { accept: 'application/json' },
      })
      if (r.ok) {
        const data = await r.json()
        html = inject(html, buildMeta(type, id, data, origin))
      }
    } catch {
      // TMDB unreachable — serve the untouched shell; the client still renders.
    }
  }

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cache the rendered preview at the edge; refresh in the background.
      'cache-control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
