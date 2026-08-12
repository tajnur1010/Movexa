// ─────────────────────────────────────────────────────────────
// Client-side SEO helpers
// Updates the document head as the SPA navigates between views.
//
// SCOPE NOTE: This helps browser tabs, bookmarks and Google's JS
// rendering. Social scrapers (Facebook, Twitter/X, WhatsApp, Telegram)
// do NOT execute JavaScript — they read the static tags baked into
// index.html. That's why the canonical link, og:url and og:image are
// left static in index.html and are intentionally NOT mutated here;
// only the per-view title/description are updated.
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

// Update the mutable, per-view SEO fields. Missing fields fall back to
// the site defaults so the head is never left blank.
export function setSeo({ title, description } = {}) {
  const finalTitle = title || DEFAULT_TITLE
  const finalDesc = description || DEFAULT_DESCRIPTION
  document.title = finalTitle
  setMetaByName('description', finalDesc)
  setMetaByProperty('og:title', finalTitle)
  setMetaByProperty('og:description', finalDesc)
  setMetaByName('twitter:title', finalTitle)
  setMetaByName('twitter:description', finalDesc)
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
