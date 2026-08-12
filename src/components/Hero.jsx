import React, { useState, useEffect, useCallback } from 'react'
import { backdropUrl } from '../lib/api.js'
import { routes, onNavClick } from '../lib/router.js'
import { IconPlay, IconInfo, IconStar, IconChevronL, IconChevronR } from './Icons.jsx'
import styles from './Hero.module.css'

// Featured carousel. `items` are normalized records with backdrops.
export default function Hero({ items = [], onPlay, onInfo }) {
  const slides = items.filter(i => i && i.backdrop).slice(0, 5)
  const [idx, setIdx] = useState(0)

  const go = useCallback((n) => {
    if (slides.length === 0) return
    setIdx(((n % slides.length) + slides.length) % slides.length)
  }, [slides.length])

  // Auto-advance; resetting whenever idx changes (incl. manual nav)
  // so a fresh 7s window starts after each change.
  useEffect(() => {
    if (slides.length <= 1) return
    const t = setTimeout(() => setIdx(i => (i + 1) % slides.length), 7000)
    return () => clearTimeout(t)
  }, [idx, slides.length])

  if (slides.length === 0) {
    return <div className={styles.hero}><div className={styles.skeleton} /></div>
  }

  const cur = slides[idx]

  return (
    <section className={styles.hero} aria-roledescription="carousel">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`${styles.bg} ${i === idx ? styles.bgActive : ''}`}
          style={{ backgroundImage: `url(${backdropUrl(s.backdrop, 'xl')})` }}
          aria-hidden={i !== idx}
        />
      ))}

      {/* anamorphic lens streak — the signature flourish */}
      <div className={styles.streak} aria-hidden="true" />
      <div className={styles.scrim} />

      {slides.length > 1 && (
        <>
          <button className={`${styles.nav} ${styles.navPrev}`} onClick={() => go(idx - 1)} aria-label="Previous title">
            <IconChevronL size={26} />
          </button>
          <button className={`${styles.nav} ${styles.navNext}`} onClick={() => go(idx + 1)} aria-label="Next title">
            <IconChevronR size={26} />
          </button>
        </>
      )}

      <div className={styles.content}>
        <div className={styles.tags}>
          <span className={styles.featured}>Featured</span>
          <span className={styles.dot}>{cur.mediaType === 'tv' ? 'Series' : 'Film'}</span>
          {cur.year && <span className={styles.dot}>{cur.year}</span>}
          {cur.rating && cur.rating !== '0.0' && (
            <span className={styles.ratingTag}><IconStar size={12} /> {cur.rating}</span>
          )}
        </div>

        <h1 className={styles.title} key={cur.id}>{cur.title}</h1>
        {cur.overview && <p className={styles.overview}>{cur.overview}</p>}

        <div className={styles.actions}>
          <a className={styles.play} href={routes.title(cur.mediaType, cur.id)} onClick={(e) => onNavClick(e, () => onPlay?.(cur))}>
            <IconPlay size={18} /> Play Now
          </a>
          <a className={styles.info} href={routes.title(cur.mediaType, cur.id)} onClick={(e) => onNavClick(e, () => onInfo?.(cur))}>
            <IconInfo size={18} /> Details
          </a>
        </div>
      </div>

      <div className={styles.dots} role="tablist" aria-label="Featured titles">
        {slides.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.pageDot} ${i === idx ? styles.pageActive : ''}`}
            onClick={() => go(i)}
            aria-label={`Show ${s.title}`}
            aria-selected={i === idx}
            role="tab"
          />
        ))}
      </div>
    </section>
  )
}
