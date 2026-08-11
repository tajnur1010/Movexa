import React from 'react'
import MediaCard from './MediaCard.jsx'
import styles from './MediaGrid.module.css'

export default function MediaGrid({ items, onSelect, selectedId, loading, skeletonCount = 14 }) {
  if (loading && (!items || items.length === 0)) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <div key={i} className={styles.skeleton} aria-hidden="true">
            <div className={styles.skPoster} />
            <div className={styles.skLine} />
          </div>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Nothing here yet</p>
        <p className={styles.emptySub}>Try another search or category.</p>
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {items.map((item, i) => (
        <div key={`${item.mediaType}-${item.id}-${i}`} className={styles.cell} style={{ animationDelay: `${Math.min(i, 12) * 28}ms` }}>
          <MediaCard item={item} onClick={onSelect} selected={item.id === selectedId} />
        </div>
      ))}
    </div>
  )
}
