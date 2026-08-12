import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────
// Minimal, dependency-free History-API router.
// Clean, crawlable paths (no more #):
//   /                     -> home
//   /browse/hollywood     -> world browse
//   /search/inception     -> search results
//   /movie/27205          -> movie detail (opens as a modal overlay)
//   /tv/94997             -> tv detail    (opens as a modal overlay)
//
// The parsed route shape { name, params } is intentionally identical to the
// previous hash router, so App / Header / Browse / Search need no logic change.
//   name:   'home' | 'world' | 'search' | 'title'
//   params: { world } | { q } | { type, id }   (type is 'movie' | 'tv')
// ─────────────────────────────────────────────────────────────

function safeDecode(s) {
  try { return decodeURIComponent(s) } catch { return s }
}

export function parsePath(pathname) {
  const parts = (pathname || '/').split('/').filter(Boolean).map(safeDecode)
  if (parts.length === 0) return { name: 'home', params: {} }
  const [head, ...rest] = parts

  switch (head) {
    case 'browse':
      return { name: 'world', params: { world: rest[0] || 'movies' } }
    case 'search':
      return { name: 'search', params: { q: rest.join('/') || '' } }
    case 'movie':
    case 'tv':
      // A media type without an id is not a valid detail page → fall back home.
      return rest[0]
        ? { name: 'title', params: { type: head, id: rest[0] } }
        : { name: 'home', params: {} }
    default:
      return { name: 'home', params: {} }
  }
}

function currentPath() {
  return window.location.pathname
}

export function useRoute() {
  const [route, setRoute] = useState(() => parsePath(currentPath()))
  useEffect(() => {
    const onPop = () => setRoute(parsePath(currentPath()))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return route
}

// Navigation helpers -----------------------------------------------------
export function navigate(path) {
  const target = path.startsWith('/') ? path : `/${path}`
  if (currentPath() === target) {
    // Force listeners to re-run even if the path is identical.
    window.dispatchEvent(new PopStateEvent('popstate'))
  } else {
    window.history.pushState({}, '', target)
    // pushState doesn't emit popstate; nudge our listeners so the view updates.
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  // Detail (movie/tv) routes open as a modal OVER the current page, so keep the
  // background scroll where it is. Every other target is a new page and should
  // start at the top — without this, clicking a link low on the page (e.g. a
  // footer nav link) leaves you scrolled to the bottom of the page you land on.
  // Back / forward and modal-close use popstate (not navigate), so those still
  // restore the previous scroll position.
  if (!/^\/(movie|tv)\/\d/.test(target)) {
    window.scrollTo(0, 0)
  }
}

// Intercept an in-app anchor click so it navigates via the History API,
// while modifier / middle / right clicks still open the real <a href> in a
// new tab (important for both users and crawlers).
export function onNavClick(e, run) {
  if (e.defaultPrevented) return
  if (e.button !== 0) return
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  e.preventDefault()
  run()
}

export const routes = {
  home: () => '/',
  world: (world) => `/browse/${world}`,
  search: (q) => `/search/${encodeURIComponent(q)}`,
  title: (type, id) => `/${type}/${id}`,
}

// One-time migration: turn a legacy hash URL (#/title/movie/27205, #/w/…,
// #/search/…) into its clean equivalent so previously shared or indexed links
// keep working. Called once from main.jsx before React mounts.
export function redirectLegacyHash() {
  const hash = window.location.hash
  if (!hash || hash === '#' || hash === '#/') {
    // Strip a bare "#"/"#/" so it doesn't linger in the address bar.
    if (hash) window.history.replaceState({}, '', window.location.pathname + window.location.search)
    return
  }
  const raw = hash.replace(/^#\/?/, '')
  const parts = raw.split('?')[0].split('/').filter(Boolean).map(safeDecode)
  if (parts.length === 0) return
  const [head, ...rest] = parts

  let clean = null
  switch (head) {
    case 'w':
      clean = routes.world(rest[0] || 'movies')
      break
    case 'search':
      clean = routes.search(rest.join('/'))
      break
    case 'title':
      if (rest[0] && rest[1]) clean = routes.title(rest[0], rest[1])
      break
    default:
      clean = null
  }
  if (clean) window.history.replaceState({}, '', clean)
}
