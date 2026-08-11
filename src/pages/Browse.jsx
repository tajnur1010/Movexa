import React, { useState, useEffect, useCallback } from 'react'
import { api, normalize } from '../lib/api.js'
import { WORLDS, resolveSort, SORT_OPTIONS } from '../data/worlds.js'
import MediaGrid from '../components/MediaGrid.jsx'
import styles from './Browse.module.css'

// Small in-memory cache so genre lists aren't refetched constantly.
let genreCache = { movie: null, tv: null }

export default function Browse({ world, onSelect }) {
  const cfg = WORLDS[world] || WORLDS.movies

  const [mediaType, setMediaType] = useState(cfg.types[0])
  const [sort, setSort] = useState('popularity.desc')
  const [genre, setGenre] = useState('') // genre id or ''
  const [genres, setGenres] = useState([])

  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Reset controls when the world changes
  useEffect(() => {
    setMediaType(cfg.types[0])
    setSort('popularity.desc')
    setGenre('')
  }, [world])

  // Load genre chips for the active media type
  useEffect(() => {
    let cancelled = false
    const load = genreCache[mediaType]
      ? Promise.resolve(genreCache[mediaType])
      : (mediaType === 'tv' ? api.tvGenres() : api.movieGenres())
          .then(d => { genreCache[mediaType] = d.genres || []; return genreCache[mediaType] })
          .catch(() => [])
    load.then(g => { if (!cancelled) setGenres(g || []) })
    return () => { cancelled = true }
  }, [mediaType])

  // Build the discover params for the current selection
  const buildParams = useCallback((p) => {
    const params = { ...cfg.base, ...resolveSort(sort, mediaType), page: p }
    // Merge genre filter with any base genre (e.g. anime = Animation)
    if (genre) {
      params.with_genres = cfg.base.with_genres
        ? `${cfg.base.with_genres},${genre}`
        : String(genre)
    }
    return params
  }, [cfg, sort, genre, mediaType])

  const fetchPage = useCallback((p) => {
    const params = buildParams(p)
    return (mediaType === 'tv' ? api.discoverTV(params) : api.discoverMovies(params))
  }, [buildParams, mediaType])

  // Initial + filter-change load
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setItems([])
    setPage(1)
    fetchPage(1)
      .then(d => {
        if (cancelled) return
        setItems((d.results || []).map(x => normalize(x, mediaType)).filter(x => x.poster))
        setTotalPages(Math.min(d.total_pages || 1, 500))
      })
      .catch(() => { if (!cancelled) setItems([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchPage, mediaType])

  function loadMore() {
    if (loadingMore || page >= totalPages) return
    const next = page + 1
    setLoadingMore(true)
    fetchPage(next)
      .then(d => {
        const more = (d.results || []).map(x => normalize(x, mediaType)).filter(x => x.poster)
        setItems(prev => {
          const seen = new Set(prev.map(i => i.id))
          return [...prev, ...more.filter(i => !seen.has(i.id))]
        })
        setPage(next)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  const showToggle = cfg.types.length > 1

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Browse</span>
        <h1 className={styles.title}>{cfg.label}</h1>
        <p className={styles.tagline}>{cfg.tagline}</p>
      </header>

      <div className={styles.controls}>
        {showToggle && (
          <div className={styles.toggle} role="tablist" aria-label="Media type">
            {cfg.types.map(t => (
              <button
                key={t}
                role="tab"
                aria-selected={mediaType === t}
                className={`${styles.toggleBtn} ${mediaType === t ? styles.toggleActive : ''}`}
                onClick={() => setMediaType(t)}
              >
                {t === 'tv' ? 'Series' : 'Movies'}
              </button>
            ))}
          </div>
        )}

        <label className={styles.sortWrap}>
          <span className={styles.sortLabel}>Sort</span>
          <select className={styles.select} value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>

      {genres.length > 0 && (
        <div className={styles.chips}>
          <button className={`${styles.chip} ${!genre ? styles.chipActive : ''}`} onClick={() => setGenre('')}>All</button>
          {genres.map(g => (
            <button
              key={g.id}
              className={`${styles.chip} ${String(genre) === String(g.id) ? styles.chipActive : ''}`}
              onClick={() => setGenre(String(g.id))}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

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
