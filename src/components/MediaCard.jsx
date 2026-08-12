import React from 'react'
import { posterUrl } from '../lib/api.js'
import { routes, onNavClick } from '../lib/router.js'
import { IconStar, IconPlay } from './Icons.jsx'
import styles from './MediaCard.module.css'

// `item` is a normalized record (see api.normalize).
export default function MediaCard({ item, onClick, selected }) {
  if (!item) return null
  const poster = posterUrl(item.poster, 'md')

  return (
    <a
      href={routes.title(item.mediaType, item.id)}
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      onClick={(e) => onNavClick(e, () => onClick?.(item))}
      title={item.title}
    >
      <div className={styles.poster}>
        {poster ? (
          <img src={poster} alt="" loading="lazy" />
        ) : (
          <div className={styles.noPoster}>
            <span>{item.title?.slice(0, 2).toUpperCase()}</span>
          </div>
        )}

        <span className={styles.type}>{item.mediaType === 'tv' ? 'Series' : 'Film'}</span>
        {item.rating && item.rating !== '0.0' && (
          <span className={styles.rating}><IconStar size={11} /> {item.rating}</span>
        )}

        <span className={styles.hover}>
          <span className={styles.playChip}><IconPlay size={16} /> Play</span>
        </span>
      </div>

      <div className={styles.info}>
        <span className={styles.title}>{item.title}</span>
        {item.year && <span className={styles.year}>{item.year}</span>}
      </div>
    </a>
  )
}
