// ─────────────────────────────────────────────────────────────
// Client-side SEO helpers
// Updates the document head as the SPA navigates between views.
//
// SCOPE NOTE: Now that routing uses clean, distinct paths (/movie/27205,
// /browse/anime, …) each view updates its own <title>, description,
// canonical link and og:url so it's self-referential. This helps browser
// tabs, bookmarks and Google's JS rendering (Googlebot executes JS).
// Social scrapers (Facebook, Twitter/X, WhatsApp, Telegram) do NOT run
// JavaScript — they read the static tags in index.html — so og:image /
// twitter:image stay a single static brand image there and are not mutated.
// ─────────────────────────────────────────────────────────────

export const DEFAULT_TITLE = 'Movexa — Watch Movies, TV Series & Anime Online'
export const DEFAULT_DESCRIPTION =
  'Movexa is a free streaming hub for movies, TV series and anime — Hollywood, Bollywood, Korean, Telugu and more. Browse by category, search any title and watch in widescreen.'

export const DEFAULT_SEO = { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION }

function upsertMeta(selector, create) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}

function setMetaByName(name, content) {
  if (!content) return
  const el = upsertMeta(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('name', name)
    return m
  })
  el.setAttribute('content', content)
}

function setMetaByProperty(property, content) {
  if (!content) return
  const el = upsertMeta(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute('property', property)
    return m
  })
  el.setAttribute('content', content)
}

// Point a <link rel="…"> at an href, creating the tag if absent.
function setLinkByRel(rel, href) {
  if (!href) return
  const el = upsertMeta(`link[rel="${rel}"]`, () => {
    const l = document.createElement('link')
    l.setAttribute('rel', rel)
    return l
  })
  el.setAttribute('href', href)
}

// Update the mutable, per-view SEO fields. Missing fields fall back to
// the site defaults so the head is never left blank.
export function setSeo({ title, description, canonical } = {}) {
  const finalTitle = title || DEFAULT_TITLE
  const finalDesc = description || DEFAULT_DESCRIPTION
  document.title = finalTitle
  setMetaByName('description', finalDesc)
  setMetaByProperty('og:title', finalTitle)
  setMetaByProperty('og:description', finalDesc)
  setMetaByName('twitter:title', finalTitle)
  setMetaByName('twitter:description', finalDesc)

  // Self-referential canonical + og:url for the current clean URL. The query
  // string is dropped so tracking params don't create duplicate-URL dilution.
  const url = canonical || (window.location.origin + window.location.pathname)
  setLinkByRel('canonical', url)
  setMetaByProperty('og:url', url)
}

// Inject or replace a JSON-LD block identified by `id`. Passing a falsy
// `obj` removes it. Used for per-title Movie / TVSeries structured data.
export function setJsonLd(id, obj) {
  const domId = `ld-${id}`
  const existing = document.getElementById(domId)
  if (!obj) {
    if (existing) existing.remove()
    return
  }
  const el = existing || document.createElement('script')
  el.type = 'application/ld+json'
  el.id = domId
  el.textContent = JSON.stringify(obj)
  if (!existing) document.head.appendChild(el)
}

export function removeJsonLd(id) {
  const el = document.getElementById(`ld-${id}`)
  if (el) el.remove()
}
