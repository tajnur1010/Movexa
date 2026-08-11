import React, { useState, useEffect, useCallback } from 'react'
import { api, normalize } from '../lib/api.js'
import MediaGrid from '../components/MediaGrid.jsx'
import styles from './Search.module.css'

export default function Search({ query, onSelect }) {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Normalise: trim + collapse inner whitespace so "one   piece " is clean.
  const term = (query || '').trim().replace(/\s+/g, ' ')

  // Query multi + TV + movie in parallel, then merge. `/search/multi` alone
  // sometimes under-ranks or omits very popular long-running titles (e.g. the
  // One Piece anime); the type-specific endpoints surface them reliably. We
  // dedupe and re-sort by popularity so the strongest match lands on top.
  const runSearch = useCallback(async (p) => {
    const empty = { results: [], total_pages: 1 }
    const [multi, tv, movie] = await Promise.all([
      api.searchMulti(term, p).catch(() => empty),
      api.searchTV(term, p).catch(() => empty),
      api.searchMovies(term, p).catch(() => empty),
    ])
    const merged = [
      ...(multi.results || []),
      ...(tv.results || []).map(r => ({ ...r, media_type: 'tv' })),
      ...(movie.results || []).map(r => ({ ...r, media_type: 'movie' })),
    ]
    const pages = Math.min(
      Math.max(multi.total_pages || 1, tv.total_pages || 1, movie.total_pages || 1),
      500,
    )
    return { merged, pages }
  }, [term])

  // Keep movie/tv with a poster, dedupe, and order by popularity.
  const clean = (results) => {
    const seen = new Set()
    const out = []
    results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .map(r => normalize(r))
      .filter(r => r && r.poster)
      .forEach(r => {
        const key = `${r.mediaType}-${r.id}`
        if (!seen.has(key)) { seen.add(key); out.push(r) }
      })
    return out.sort((a, b) => (b.raw?.popularity || 0) - (a.raw?.popularity || 0))
  }

  useEffect(() => {
    if (!term) { setItems([]); setLoading(false); return }
    let cancelled = false
    setLoading(true); setItems([]); setPage(1)
    runSearch(1)
      .then(({ merged, pages }) => {
        if (cancelled) return
        setItems(clean(merged))
        setTotalPages(pages)
      })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [runSearch, term])

  function loadMore() {
    if (loadingMore || page >= totalPages) return
    const next = page + 1
    setLoadingMore(true)
    runSearch(next)
      .then(({ merged }) => {
        const more = clean(merged)
        setItems(prev => {
          const seen = new Set(prev.map(i => `${i.mediaType}-${i.id}`))
          return [...prev, ...more.filter(i => !seen.has(`${i.mediaType}-${i.id}`))]
        })
        setPage(next)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  return (
    <div className={styles.page}>
      <MediaGrid items={items} onSelect={onSelect} loading={loading} />

      {!loading && items.length > 0 && page < totalPages && (
        <div className={styles.moreWrap}>
          <button className={styles.moreBtn} onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
