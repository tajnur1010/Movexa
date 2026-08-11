import React, { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import styles from './SeasonPicker.module.css'

// Episode browser. Receives the show id + its seasons array (from tvDetails),
// fetches episodes for the active season, and calls onPlay(season, episode).
// Seasons and episodes are shown as compact numbered tiles; the active one is
// highlighted with the site accent.
export default function SeasonPicker({ showId, seasons = [], activeKey, onPlay }) {
  const list = seasons.filter(s => s.season_number > 0)
  const initial = list[0]?.season_number || 1
  const [activeSeason, setActiveSeason] = useState(initial)
  const [episodes, setEpisodes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { setActiveSeason(list[0]?.season_number || 1) }, [showId])

  useEffect(() => {
    if (!showId || !activeSeason) return
    let cancelled = false
    setLoading(true)
    setEpisodes([])
    api.seasonDetails(showId, activeSeason)
      .then(d => { if (!cancelled) setEpisodes(d.episodes || []) })
      .catch(() => { if (!cancelled) setEpisodes([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [showId, activeSeason])

  const tabs = list.length > 0 ? list : [{ season_number: 1, name: 'Season 1' }]

  return (
    <div className={styles.wrap}>
      {tabs.length > 1 && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>Season</span>
          <div className={styles.grid} role="tablist" aria-label="Seasons">
            {tabs.map(s => (
              <button
                key={s.season_number}
                role="tab"
                aria-selected={activeSeason === s.season_number}
                className={`${styles.box} ${activeSeason === s.season_number ? styles.boxActive : ''}`}
                onClick={() => setActiveSeason(s.season_number)}
                title={s.name || `Season ${s.season_number}`}
              >
                {s.season_number}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={styles.row}>
        <span className={styles.rowLabel}>
          {episodes.length > 0 ? `1 – ${episodes.length}` : 'Episodes'}
        </span>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 12 }).map((_, i) => <div key={i} className={styles.boxSkel} />)}
          </div>
        ) : episodes.length > 0 ? (
          <div className={styles.grid} role="list" aria-label="Episodes">
            {episodes.map(ep => {
              const key = `S${activeSeason}E${ep.episode_number}`
              const active = key === activeKey
              return (
                <button
                  key={ep.episode_number}
                  role="listitem"
                  className={`${styles.box} ${active ? styles.boxActive : ''}`}
                  onClick={() => onPlay?.(activeSeason, ep.episode_number)}
                  title={ep.name || `Episode ${ep.episode_number}`}
                >
                  {ep.episode_number}
                </button>
              )
            })}
          </div>
        ) : (
          <p className={styles.noEps}>No episode data available for this season.</p>
        )}
      </div>
    </div>
  )
}
