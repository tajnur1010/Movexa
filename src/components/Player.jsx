import React, { useState } from 'react'
import styles from './Player.module.css'

// Cinematic embed frame. `src` is the codespecters embed URL.
export default function Player({ src, label }) {
  const [loaded, setLoaded] = useState(false)
  if (!src) return null

  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        {!loaded && (
          <div className={styles.loading} aria-hidden="true">
            <span className={styles.reel} />
            <span className={styles.loadingText}>Loading stream…</span>
          </div>
        )}
        <iframe
          src={src}
          onLoad={() => setLoaded(true)}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          title={label || 'Player'}
        />
      </div>
      <p className={styles.hint}>
        {label ? <span className={styles.nowPlaying}>{label}</span> : null}
        <span className={styles.tip}>Use the player's own controls for quality, subtitles &amp; fullscreen. Sources are provided by the embed API.</span>
      </p>
    </div>
  )
}
