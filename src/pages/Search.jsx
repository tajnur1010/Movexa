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

  const clean = (results) =>
    results
      .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
      .map(r => normalize(r))
      .filter(r => r.poster)

  const runSearch = useCallback((p) => api.searchMulti(query, p), [query])

  useEffect(() => {
    if (!query) return
    let cancelled = false
    setLoading(true); setItems([]); setPage(1)
    runSearch(1)
      .then(d => {
        if (cancelled) return
        setItems(clean(d.results || []))
        setTotalPages(Math.min(d.total_pages || 1, 500))
      })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [runSearch, query])

  function loadMore() {
    if (loadingMore || page >= totalPages) return
    const next = page + 1
    setLoadingMore(true)
    runSearch(next)
      .then(d => {
        const more = clean(d.results || [])
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
