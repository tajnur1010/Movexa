import React, { useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { IconPlay } from './Icons.jsx'
import styles from './SeasonPicker.module.css'

// Episode browser. Receives the show id + its seasons array (from tvDetails),
// fetches episodes for the active season, and calls onPlay(season, episode).
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
      <div className={styles.tabs} role="tablist" aria-label="Seasons">
        {tabs.map(s => (
          <button
            key={s.season_number}
            role="tab"
            aria-selected={activeSeason === s.season_number}
            className={`${styles.tab} ${activeSeason === s.season_number ? styles.tabActive : ''}`}
            onClick={() => setActiveSeason(s.season_number)}
          >
            Season {s.season_number}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.epList}>
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className={styles.epSkel} />)}
        </div>
      ) : episodes.length > 0 ? (
        <div className={styles.epList}>
          {episodes.map(ep => {
            const key = `S${activeSeason}E${ep.episode_number}`
            const active = key === activeKey
            return (
              <button
                key={ep.episode_number}
                className={`${styles.ep} ${active ? styles.epActive : ''}`}
                onClick={() => onPlay?.(activeSeason, ep.episode_number)}
                title={ep.name || `Episode ${ep.episode_number}`}
              >
                <span className={styles.epNum}>{ep.episode_number}</span>
                <span className={styles.epName}>{ep.name || `Episode ${ep.episode_number}`}</span>
                <span className={styles.epPlay}><IconPlay size={13} /></span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className={styles.noEps}>No episode data available for this season.</p>
      )}
    </div>
  )
}
