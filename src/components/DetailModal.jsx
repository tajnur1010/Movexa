import React, { useState, useEffect, useRef } from 'react'
import {
  api, backdropUrl, posterUrl, profileUrl, movieEmbedUrl, tvEmbedUrl,
  movieDownloadUrl, tvDownloadUrl,
  formatRating, getYear, runtimeText, pickTrailer, normalize,
} from '../lib/api.js'
import { navigate, routes } from '../lib/router.js'
import { IconPlay, IconClose, IconStar, IconDownload } from './Icons.jsx'
import Player from './Player.jsx'
import SeasonPicker from './SeasonPicker.jsx'
import styles from './DetailModal.module.css'

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

  function scrollToPlayer() {
    setTimeout(() => playRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  function playMovie() {
    setPlay({ src: movieEmbedUrl(id), label: title })
    setShowTrailer(false)
    scrollToPlayer()
  }

  function playEpisode(season, episode) {
    setPlay({
      src: tvEmbedUrl(id, season, episode),
      label: `${title} · S${season} E${episode}`,
      epKey: `S${season}E${episode}`,
      season,
      episode,
    })
    setShowTrailer(false)
    scrollToPlayer()
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
                      <button className={styles.playBtn} onClick={isTV ? scrollToPlayer : playMovie}>
                        <IconPlay size={18} /> {isTV ? 'Watch Episodes' : 'Play Now'}
                      </button>
                      {trailer && (
                        <button className={styles.trailerBtn} onClick={() => setShowTrailer(s => !s)}>
                          {showTrailer ? 'Hide Trailer' : 'Watch Trailer'}
                        </button>
                      )}
                      {!isTV && (
                        <a
                          className={styles.downloadBtn}
                          href={movieDownloadUrl(id)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconDownload size={18} /> Download
                        </a>
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

                {play && (
                  <section className={styles.section} ref={playRef}>
                    <div className={styles.nowHead}>
                      <h2 className={styles.h2}>Now Playing</h2>
                      <a
                        className={styles.downloadBtnSm}
                        href={isTV ? tvDownloadUrl(id, play.season, play.episode) : movieDownloadUrl(id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <IconDownload size={16} /> Download
                      </a>
                    </div>
                    <Player src={play.src} label={play.label} />
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
                        <button
                          key={s.id}
                          className={styles.simCard}
                          onClick={() => navigate(routes.title(s.mediaType, s.id))}
                          title={s.title}
                        >
                          <div className={styles.simPoster}>
                            <img src={posterUrl(s.poster, 'md')} alt="" loading="lazy" />
                            {s.rating && s.rating !== '0.0' && (
                              <span className={styles.simRating}><IconStar size={10} /> {s.rating}</span>
                            )}
                          </div>
                          <span className={styles.simTitle}>{s.title}</span>
                        </button>
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
