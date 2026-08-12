// ─────────────────────────────────────────────────────────────
// Movexa API layer
// TMDB for metadata + artwork, VidSrc embed for streaming.
// ─────────────────────────────────────────────────────────────

export const TMDB_KEY = '24b293c7f17afc27e9b7357dea0e7f8a' // get tmdb api key free at https://www.themoviedb.org/settings/api

// Streaming embed provider: VidSrc (no API key required).
// VidSrc rotates domains sometimes — if playback stops working, swap
// EMBED_BASE to a mirror (same URL shape): vidsrc.me · vidsrc.net · vidsrc.in · vidsrc.pm
export const EMBED_BASE = 'https://vidsrcme.ru'
export const EMBED_API_KEY = 'nx_2cad09f6e1cbe42cbfe00e7a36c8037f' // (unused with VidSrc; kept for revert)


// Image CDNs (multiple sizes for crisp cards, rows and hero backdrops)
export const IMG_BASE = 'https://image.tmdb.org/t/p/w300'
export const IMG_BASE_LG = 'https://image.tmdb.org/t/p/w780'
const POSTER_SIZES = { sm: 'w185', md: 'w342', lg: 'w500' }
const BACKDROP_SIZES = { md: 'w780', lg: 'w1280', xl: 'original' }
const PROFILE_SIZE = 'w185'
const IMG_ROOT = 'https://image.tmdb.org/t/p'

async function tmdbFetch(path) {
  const sep = path.includes('?') ? '&' : '?'
  const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${TMDB_KEY}`)
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

// Turn a { with_genres, with_original_language, region, sort_by, page } object
// into a TMDB query string. Undefined / empty values are skipped.
function buildQuery(params = {}) {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  // Trending
  trendingMovies: () => tmdbFetch('/trending/movie/week'),
  trendingTV: () => tmdbFetch('/trending/tv/week'),
  trendingAll: () => tmdbFetch('/trending/all/week'),

  // Curated lists
  popularMovies: (page = 1) => tmdbFetch(`/movie/popular?page=${page}`),
  popularTV: (page = 1) => tmdbFetch(`/tv/popular?page=${page}`),
  topRatedMovies: (page = 1) => tmdbFetch(`/movie/top_rated?page=${page}`),
  topRatedTV: (page = 1) => tmdbFetch(`/tv/top_rated?page=${page}`),
  nowPlaying: (page = 1) => tmdbFetch(`/movie/now_playing?page=${page}`),
  airingToday: (page = 1) => tmdbFetch(`/tv/airing_today?page=${page}`),

  // Discover (drives the Anime / Hindi / Hollywood / Bollywood worlds)
  discoverMovies: (params) => tmdbFetch(`/discover/movie${buildQuery(params)}`),
  discoverTV: (params) => tmdbFetch(`/discover/tv${buildQuery(params)}`),

  // Genres
  movieGenres: () => tmdbFetch('/genre/movie/list'),
  tvGenres: () => tmdbFetch('/genre/tv/list'),

  // Search
  searchMovies: (q, page = 1) => tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}&page=${page}`),
  searchTV: (q, page = 1) => tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}&page=${page}`),
  searchMulti: (q, page = 1) => tmdbFetch(`/search/multi?query=${encodeURIComponent(q)}&page=${page}`),

  // Details + extras (append_to_response keeps it to a single round-trip)
  movieDetails: (id) => tmdbFetch(`/movie/${id}?append_to_response=credits,videos,similar,release_dates`),
  tvDetails: (id) => tmdbFetch(`/tv/${id}?append_to_response=credits,videos,similar,content_ratings`),
  seasonDetails: (id, season) => tmdbFetch(`/tv/${id}/season/${season}`),
}

// ── Embed URLs (multi-server with fallback) ───────────────────
// Independent providers. If one has no source / is down, the user can switch
// servers in the player. None require an API key.
//   Server 1 — VidSrc.sbs  (TMDB id; user-confirmed working)
//   Server 2 — VidLink     (TMDB id)
//   Server 3 — VidSrc      (movie by IMDb id, falls back to TMDB; TV by TMDB id)
//   Server 4 — VidSrc.vip  (TMDB id)
// If any provider rotates its domain, change its URL in BOTH helpers below.

// `imdbId` is optional; used by Server 3 (VidSrc) which prefers IMDb ids for movies.
export function movieServers(tmdbId, imdbId) {
  return [
    { id: 'vidsrcsbs', label: 'Server 1', src: `https://vidsrc.sbs/embed/movie/${tmdbId}` },
    { id: 'vidlink', label: 'Server 2', src: `https://vidlink.pro/movie/${tmdbId}` },
    { id: 'vidsrc', label: 'Server 3', src: `https://vidsrcme.ru/embed/movie/${imdbId || tmdbId}` },
    { id: 'vidsrcvip', label: 'Server 4', src: `https://vidsrc.vip/embed/movie/${tmdbId}` },
  ]
}

export function tvServers(tmdbId, season, episode) {
  return [
    { id: 'vidsrcsbs', label: 'Server 1', src: `https://vidsrc.sbs/embed/tv/${tmdbId}/${season}/${episode}` },
    { id: 'vidlink', label: 'Server 2', src: `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}` },
    { id: 'vidsrc', label: 'Server 3', src: `https://vidsrcme.ru/embed/tv/${tmdbId}/${season}/${episode}` },
    { id: 'vidsrcvip', label: 'Server 4', src: `https://vidsrc.vip/embed/tv/${tmdbId}/${season}/${episode}` },
  ]
}

// Back-compat single-URL helpers (default = Server 1 / VidSrc.sbs).
export function movieEmbedUrl(tmdbId) {
  return `https://vidsrc.sbs/embed/movie/${tmdbId}`
}

export function tvEmbedUrl(tmdbId, season, episode) {
  return `https://vidsrc.sbs/embed/tv/${tmdbId}/${season}/${episode}`
}

// ── Download URLs ─────────────────────────────────────────────
// Mirrors the embed pattern (provider-dependent). If your provider uses a
// different path (e.g. /dl/ or a `download` query flag), change ONLY the two
// functions below — the UI reads from here.
export function movieDownloadUrl(tmdbId) {
  return `${EMBED_BASE}/download/movie/${tmdbId}?apikey=${EMBED_API_KEY}`
}

export function tvDownloadUrl(tmdbId, season, episode) {
  return `${EMBED_BASE}/download/tv/${tmdbId}/${season}/${episode}?apikey=${EMBED_API_KEY}`
}

// ── Image helpers ─────────────────────────────────────────────
export function posterUrl(path, size = 'md') {
  if (!path) return null
  return `${IMG_ROOT}/${POSTER_SIZES[size] || POSTER_SIZES.md}${path}`
}

export function backdropUrl(path, size = 'lg') {
  if (!path) return null
  return `${IMG_ROOT}/${BACKDROP_SIZES[size] || BACKDROP_SIZES.lg}${path}`
}

export function profileUrl(path) {
  if (!path) return null
  return `${IMG_ROOT}/${PROFILE_SIZE}${path}`
}

// ── Formatting helpers ────────────────────────────────────────
export function formatRating(rating) {
  if (!rating) return null
  return parseFloat(rating).toFixed(1)
}

export function getYear(dateStr) {
  return (dateStr || '').slice(0, 4)
}

export function runtimeText(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m}m` : `${m}m`
}

// Normalise a movie or TV record into a shared shape the UI can rely on.
export function normalize(item, fallbackType) {
  if (!item) return null
  const mediaType = item.media_type === 'movie' || item.media_type === 'tv'
    ? item.media_type
    : (fallbackType || (item.title ? 'movie' : 'tv'))
  return {
    id: item.id,
    mediaType,
    title: item.title || item.name || 'Untitled',
    year: getYear(item.release_date || item.first_air_date),
    rating: formatRating(item.vote_average),
    overview: item.overview || '',
    poster: item.poster_path,
    backdrop: item.backdrop_path,
    genreIds: item.genre_ids || [],
    raw: item,
  }
}

// Pick the best trailer/teaser from a videos payload.
export function pickTrailer(videos) {
  const results = videos?.results || []
  const yt = results.filter(v => v.site === 'YouTube')
  return (
    yt.find(v => v.type === 'Trailer' && v.official) ||
    yt.find(v => v.type === 'Trailer') ||
    yt.find(v => v.type === 'Teaser') ||
    yt[0] ||
    null
  )
}
