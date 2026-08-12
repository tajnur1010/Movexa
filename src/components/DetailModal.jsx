import React, { useState, useEffect, useRef } from 'react'
import {
  api, backdropUrl, posterUrl, profileUrl, movieServers, tvServers,
  formatRating, getYear, runtimeText, pickTrailer, normalize,
} from '../lib/api.js'
import { navigate, routes, onNavClick } from '../lib/router.js'
import { setSeo, setJsonLd, removeJsonLd } from '../lib/seo.js'
import { WORLDS } from '../data/worlds.js'
import { IconPlay, IconClose, IconStar } from './Icons.jsx'
import Player from './Player.jsx'
import SeasonPicker from './SeasonPicker.jsx'
import styles from './DetailModal.module.css'

// Map a title's TMDB original_language to a category "world" that has a REAL
// /browse/:world route — so detail pages only ever link to pages that exist
// (no fabricated genre/region routes).
const LANG_WORLD = { hi: 'bollywood', en: 'hollywood', ta: 'south', te: 'telugu', bn: 'bangla', ko: 'korean', zh: 'chinese' }

// The browse worlds a title belongs to. Index 0 is always the media-type world
// (movies | series) — used for the breadcrumb. Any extras (anime, region) power
// the compact "Explore" links. Deduped; extras collapse to nothing when none
// apply (e.g. a French film → no region link rather than a broken one).
function relatedWorlds(type, data) {
  const out = [type === 'tv' ? 'series' : 'movies']
  const genreIds = (data?.genres || []).map((g) => g.id)
  if (genreIds.includes(16) && data?.original_language === 'ja') out.push('anime')
  const langWorld = LANG_WORLD[data?.original_language]
  if (langWorld) out.push(langWorld)
  return [...new Set(out)]
}

export default function DetailModal({ type, id, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [play, setPlay] = useState(null) // { src, label, epKey }
  const [showTrailer, setShowTrailer] = useState(false)
  const scrollRef = useRef(null)
  const playRef = useRef(null)

  const isTV = type === 'tv'

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Fetch details whenever the target changes; reset transient state
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(false); setData(null); setPlay(null); setShowTrailer(false)
    scrollRef.current?.scrollTo(0, 0)
    const fetcher = isTV ? api.tvDetails(id) : api.movieDetails(id)
    fetcher
      .then(d => { if (!cancelled) setData(d) })
      .catch(() => { if (!cancelled) setError(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [type, id])

  // Enrich the document head with this title's SEO once TMDB data is in.
  // Uses ONLY real TMDB fields — no fabricated ratings, reviews or keywords.
  useEffect(() => {
    if (!data) return
    const name = data.title || data.name || 'Movexa'
    const yr = getYear(data.release_date || data.first_air_date)
    const kind = isTV ? 'TV series' : 'movie'
    const genreNames = (data.genres || []).map(g => g.name)
    const overview = (data.overview || '').trim()
    const fallback = `Watch ${name}${yr ? ` (${yr})` : ''}${genreNames.length ? `, ${genreNames.slice(0, 3).join(', ')}` : ''} ${kind}, on Movexa.`
    const raw = overview || fallback
    const description = raw.length > 160 ? `${raw.slice(0, 157).trimEnd()}…` : raw
    setSeo({
      title: `${name}${yr ? ` (${yr})` : ''} — Watch on Movexa`,
      description,
    })

    const ld = {
      '@context': 'https://schema.org',
      '@type': isTV ? 'TVSeries' : 'Movie',
      name,
      url: `https://movexa-sigma.vercel.app/${type}/${id}`,
    }
    if (overview) ld.description = overview
    const img = posterUrl(data.poster_path, 'lg')
    if (img) ld.image = img
    const date = data.release_date || data.first_air_date
    if (date) ld.datePublished = date
    if (genreNames.length) ld.genre = genreNames
    // aggregateRating only when TMDB actually holds votes — never invented.
    if (data.vote_average > 0 && data.vote_count > 0) {
      ld.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: Number(data.vote_average).toFixed(1),
        ratingCount: data.vote_count,
        bestRating: 10,
        worstRating: 1,
      }
    }
    setJsonLd('title', ld)

    return () => removeJsonLd('title')
  }, [data, isTV, type, id])

  function scrollToPlayer() {
    setTimeout(() => playRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  function playMovie() {
    // VidSrc prefers IMDb id; other servers use the TMDB id.
    setPlay({ servers: movieServers(id, data?.imdb_id), label: title })
    setShowTrailer(false)
    scrollToPlayer()
  }

  function playEpisode(season, episode) {
    setPlay({
      servers: tvServers(id, season, episode),
      label: `${title} · S${season} E${episode}`,
      epKey: `S${season}E${episode}`,
      season,
      episode,
    })
    setShowTrailer(false)
    scrollToPlayer()
  }

  // "Watch Now" on a series jumps straight into the first episode of the
  // first real season (skips specials / season 0).
  function watchTV() {
    const first = (data?.seasons || [])
      .filter(s => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number)[0]
    playEpisode(first?.season_number || 1, 1)
  }

  const title = data?.title || data?.name || ''
  const year = getYear(data?.release_date || data?.first_air_date)
  const rating = formatRating(data?.vote_average)
  const genres = data?.genres || []
  const cast = (data?.credits?.cast || []).slice(0, 12)
  const trailer = pickTrailer(data?.videos)
  const similar = (data?.similar?.results || []).map(x => normalize(x, type)).filter(x => x.poster).slice(0, 12)
  const runtime = isTV
    ? (data?.number_of_seasons ? `${data.number_of_seasons} season${data.number_of_seasons > 1 ? 's' : ''}` : null)
    : runtimeText(data?.runtime)
  const backdrop = backdropUrl(data?.backdrop_path, 'lg')
  // Browse worlds this title links back to (breadcrumb parent + Explore links).
  const related = data ? relatedWorlds(type, data) : []

  return (
    <div className={styles.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={title || 'Details'}>
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <IconClose size={20} />
        </button>

        <div className={styles.scroll} ref={scrollRef}>
          {loading && <div className={styles.loading}><span className={styles.spinner} /></div>}

          {error && !loading && (
            <div className={styles.errorBox}>
              <p className={styles.errorTitle}>Couldn't load this title</p>
              <p className={styles.errorSub}>Please check your connection and try again.</p>
            </div>
          )}

          {data && !loading && (
            <>
              <div className={styles.head}>
                {backdrop && <div className={styles.backdrop} style={{ backgroundImage: `url(${backdrop})` }} />}
                <div className={styles.headScrim} />
                {showTrailer && trailer && (
                  <div className={styles.trailerWrap}>
                    <iframe
                      src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0`}
                      title="Trailer"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  </div>
                )}
                <div className={styles.headInner}>
                  {posterUrl(data.poster_path, 'md') && (
                    <img className={styles.poster} src={posterUrl(data.poster_path, 'lg')} alt="" />
                  )}
                  <div className={styles.headMeta}>
                    <nav className={styles.crumbs} aria-label="Breadcrumb">
                      <a
                        className={styles.crumb}
                        href={routes.home()}
                        onClick={(e) => onNavClick(e, () => navigate(routes.home()))}
                      >
                        Home
                      </a>
                      <span className={styles.crumbSep}>/</span>
                      <a
                        className={styles.crumb}
                        href={routes.world(related[0])}
                        onClick={(e) => onNavClick(e, () => navigate(routes.world(related[0])))}
                      >
                        {WORLDS[related[0]].label}
                      </a>
                      <span className={styles.crumbSep}>/</span>
                      <span className={styles.crumbCurrent}>{title}</span>
                    </nav>
                    <span className={styles.kind}>{isTV ? 'TV Series' : 'Film'}</span>
                    <h1 className={styles.title}>{title}</h1>
                    {data.tagline && <p className={styles.tagline}>"{data.tagline}"</p>}
                    <div className={styles.facts}>
                      {year && <span>{year}</span>}
                      {runtime && <span>{runtime}</span>}
                      {rating && rating !== '0.0' && (
                        <span className={styles.rating}><IconStar size={13} /> {rating}</span>
                      )}
                    </div>
                    {genres.length > 0 && (
                      <div className={styles.genres}>
                        {genres.map(g => <span key={g.id} className={styles.genre}>{g.name}</span>)}
                      </div>
                    )}
                    <div className={styles.actions}>
                      <button className={styles.playBtn} onClick={isTV ? watchTV : playMovie}>
                        <IconPlay size={18} /> {isTV ? 'Watch Now' : 'Play Now'}
                      </button>
                      {trailer && (
                        <button className={styles.trailerBtn} onClick={() => setShowTrailer(s => !s)}>
                          {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.body}>
                {data.overview && (
                  <section className={styles.section}>
                    <p className={styles.overview}>{data.overview}</p>
                  </section>
                )}

                {related.length > 1 && (
                  <section className={styles.section}>
                    <div className={styles.explore}>
                      <span className={styles.exploreLabel}>Explore</span>
                      {related.slice(1).map((key) => (
                        <a
                          key={key}
                          className={styles.exploreLink}
                          href={routes.world(key)}
                          onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}
                        >
                          {WORLDS[key].label}
                        </a>
                      ))}
                    </div>
                  </section>
                )}

                {play && (
                  <section className={styles.section} ref={playRef}>
                    <h2 className={styles.h2}>Now Playing</h2>
                    <Player servers={play.servers} label={play.label} />
                  </section>
                )}

                {isTV && (
                  <section className={styles.section} ref={!play ? playRef : null}>
                    <h2 className={styles.h2}>Episodes</h2>
                    <SeasonPicker
                      showId={id}
                      seasons={data.seasons || []}
                      activeKey={play?.epKey}
                      onPlay={playEpisode}
                    />
                  </section>
                )}

                {cast.length > 0 && (
                  <section className={styles.section}>
                    <h2 className={styles.h2}>Cast</h2>
                    <div className={styles.castRow}>
                      {cast.map(c => (
                        <div key={c.id} className={styles.castCard}>
                          <div className={styles.castImg}>
                            {profileUrl(c.profile_path)
                              ? <img src={profileUrl(c.profile_path)} alt="" loading="lazy" />
                              : <div className={styles.castFallback}>{c.name?.slice(0, 1)}</div>}
                          </div>
                          <span className={styles.castName}>{c.name}</span>
                          {c.character && <span className={styles.castChar}>{c.character}</span>}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {similar.length > 0 && (
                  <section className={styles.section}>
                    <h2 className={styles.h2}>More Like This</h2>
                    <div className={styles.similarGrid}>
                      {similar.map(s => (
                        <a
                          key={s.id}
                          className={styles.simCard}
                          href={routes.title(s.mediaType, s.id)}
                          onClick={(e) => onNavClick(e, () => navigate(routes.title(s.mediaType, s.id)))}
                          title={s.title}
                        >
                          <div className={styles.simPoster}>
                            <img src={posterUrl(s.poster, 'md')} alt="" loading="lazy" />
                            {s.rating && s.rating !== '0.0' && (
                              <span className={styles.simRating}><IconStar size={10} /> {s.rating}</span>
                            )}
                          </div>
                          <span className={styles.simTitle}>{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
