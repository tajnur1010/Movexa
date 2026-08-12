import React, { useRef, useState, useEffect } from 'react'
import { posterUrl, backdropUrl } from '../lib/api.js'
import { routes, onNavClick, navigate } from '../lib/router.js'
import { WORLDS } from '../data/worlds.js'
import { IconChevronL, IconChevronR, IconStar, IconPlay } from './Icons.jsx'
import styles from './Row.module.css'

export default function Row({ title, eyebrow, items = [], loading, onSelect, variant = 'poster', world }) {
  const scrollerRef = useRef(null)
  const [canL, setCanL] = useState(false)
  const [canR, setCanR] = useState(true)

  function update() {
    const el = scrollerRef.current
    if (!el) return
    setCanL(el.scrollLeft > 8)
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }

  useEffect(() => { update() }, [items, loading])

  function scrollBy(dir) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.82, behavior: 'smooth' })
  }

  const showSkeleton = loading && items.length === 0

  return (
    <section className={styles.row}>
      <div className={styles.head}>
        <div>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          {world && WORLDS[world] && !loading ? (
            <a
              className={styles.titleLink}
              href={routes.world(world)}
              onClick={(e) => onNavClick(e, () => navigate(routes.world(world)))}
              aria-label={`Browse all ${WORLDS[world].label}`}
            >
              <h2 className={styles.title}>{title}</h2>
              <span className={styles.titleArrow}><IconChevronR size={16} /></span>
            </a>
          ) : (
            <h2 className={styles.title}>{title}</h2>
          )}
        </div>
        <div className={styles.arrows}>
          <button className={styles.arrow} onClick={() => scrollBy(-1)} disabled={!canL} aria-label="Scroll left">
            <IconChevronL size={20} />
          </button>
          <button className={styles.arrow} onClick={() => scrollBy(1)} disabled={!canR} aria-label="Scroll right">
            <IconChevronR size={20} />
          </button>
        </div>
      </div>

      <div className={styles.scroller} ref={scrollerRef} onScroll={update}>
        {showSkeleton
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`${styles.item} ${variant === 'wide' ? styles.wide : ''}`}>
                <div className={styles.skel} />
              </div>
            ))
          : items.map((item, i) => {
              const isWide = variant === 'wide'
              const img = isWide ? backdropUrl(item.backdrop || item.poster, 'md') : posterUrl(item.poster, 'md')
              return (
                <a
                  key={`${item.mediaType}-${item.id}-${i}`}
                  href={routes.title(item.mediaType, item.id)}
                  className={`${styles.item} ${isWide ? styles.wide : ''}`}
                  onClick={(e) => onNavClick(e, () => onSelect?.(item))}
                  title={item.title}
                >
                  <div className={styles.thumb}>
                    {img
                      ? <img src={img} alt={item.title} loading="lazy" decoding="async" />
                      : <div className={styles.noImg}>{item.title?.slice(0, 2).toUpperCase()}</div>}
                    <span className={styles.play}><IconPlay size={15} /></span>
                    {item.rating && item.rating !== '0.0' && (
                      <span className={styles.rating}><IconStar size={10} /> {item.rating}</span>
                    )}
                  </div>
                  {isWide && (
                    <div className={styles.cap}>
                      <span className={styles.capTitle}>{item.title}</span>
                      {item.year && <span className={styles.capYear}>{item.year}</span>}
                    </div>
                  )}
                </a>
              )
            })}
      </div>
    </section>
  )
}
