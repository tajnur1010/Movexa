import { useState, useEffect } from 'react'

// Minimal dependency-free hash router.
// Route shape: { name, params } parsed from location.hash.
//   #/                         -> home
//   #/w/hollywood              -> world browse
//   #/search/inception         -> search results
//   #/title/movie/27205        -> detail (opens as modal overlay)
export function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '')
  const [pathPart, queryPart] = raw.split('?')
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent)
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''))

  if (parts.length === 0) return { name: 'home', params: {}, query }
  const [head, ...rest] = parts

  switch (head) {
    case 'w':
      return { name: 'world', params: { world: rest[0] || 'movies' }, query }
    case 'search':
      return { name: 'search', params: { q: rest.join('/') || '' }, query }
    case 'title':
      return { name: 'title', params: { type: rest[0], id: rest[1] }, query }
    default:
      return { name: 'home', params: {}, query }
  }
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

// Navigation helpers -----------------------------------------------------
export function navigate(path) {
  const target = path.startsWith('#') ? path : `#${path}`
  if (window.location.hash === target) {
    // force listeners to re-run even if the hash is identical
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  } else {
    window.location.hash = target
  }
}

export const routes = {
  home: () => '#/',
  world: (world) => `#/w/${world}`,
  search: (q) => `#/search/${encodeURIComponent(q)}`,
  title: (type, id) => `#/title/${type}/${id}`,
}
