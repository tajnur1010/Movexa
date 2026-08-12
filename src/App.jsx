import React, { useRef, useEffect } from 'react'
import { useRoute, navigate, routes, onNavClick } from './lib/router.js'
import Header from './components/Header.jsx'
import DetailModal from './components/DetailModal.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import { WORLDS } from './data/worlds.js'
import { setSeo, DEFAULT_SEO } from './lib/seo.js'
import styles from './App.module.css'

// Footer sitewide nav — every category world reachable in one click from any
// page (keeps browse worlds out of orphan status and within crawl depth 1).
// Keys must exist in WORLDS; labels come from there so anchors stay descriptive.
const FOOT_GROUPS = [
  { label: 'Browse', worlds: ['movies', 'series', 'anime'] },
  { label: 'Indian Cinema', worlds: ['bollywood', 'south', 'telugu', 'bangla'] },
  { label: 'International', worlds: ['hollywood', 'korean', 'chinese'] },
]

export default function App() {
  const route = useRoute()

  // Remember the last non-modal route so the page behind the detail
  // modal stays put instead of flashing back to Home.
  const bgRef = useRef({ name: 'home', params: {} })
  if (route.name !== 'title') bgRef.current = route
  const bg = route.name === 'title' ? bgRef.current : route

  const showModal = route.name === 'title' && route.params.id

  // Keep the document head in sync with the active view. Detail (title) pages
  // are enriched further by DetailModal once TMDB data loads; here we set a
  // sensible default so the tab/description is never stale between views.
  useEffect(() => {
    if (route.name === 'world') {
      const w = WORLDS[route.params.world] || WORLDS.movies
      setSeo({
        title: `${w.label} — Movexa`,
        description: `${w.tagline} Browse, search and watch on Movexa.`,
      })
    } else if (route.name === 'search') {
      const q = route.params.q || ''
      setSeo({
        title: q ? `Search: ${q} — Movexa` : 'Search — Movexa',
        description: q
          ? `Movies, TV series and anime matching "${q}" on Movexa.`
          : 'Search movies, TV series and anime on Movexa.',
      })
    } else {
      // Home, or the title route before the modal's TMDB data arrives.
      setSeo(DEFAULT_SEO)
    }
  }, [route])

  function openTitle(item) {
    if (!item) return
    const mediaType = item.mediaType || (item.title ? 'movie' : 'tv')
    navigate(routes.title(mediaType, item.id))
  }

  function renderPage(r) {
    switch (r.name) {
      case 'world': {
        const world = WORLDS[r.params.world] ? r.params.world : 'movies'
        return <Browse key={world} world={world} onSelect={openTitle} />
      }
      case 'search':
        return <Search key={r.params.q} query={r.params.q} onSelect={openTitle} />
      case 'home':
      default:
        return <Home onSelect={openTitle} />
    }
  }

  return (
    <div className={styles.app}>
      <Header route={route} />

      <main className={styles.main}>
        {renderPage(bg)}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footInner}>
          <nav className={styles.footNav} aria-label="Footer">
            <div className={styles.footCol}>
              <span className={styles.footColLabel}>Browse</span>
              <a
                className={styles.footNavLink}
                href={routes.home()}
                onClick={(e) => onNavClick(e, () => navigate(routes.home()))}
              >
                Home
              </a>
              {FOOT_GROUPS[0].worlds.map((key) => (
                <a
                  key={key}
                  className={styles.footNavLink}
                  href={routes.world(key)}
                  onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}
                >
                  {WORLDS[key].label}
                </a>
              ))}
            </div>
            {FOOT_GROUPS.slice(1).map((group) => (
              <div className={styles.footCol} key={group.label}>
                <span className={styles.footColLabel}>{group.label}</span>
                {group.worlds.map((key) => (
                  <a
                    key={key}
                    className={styles.footNavLink}
                    href={routes.world(key)}
                    onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}
                  >
                    {WORLDS[key].label}
                  </a>
                ))}
              </div>
            ))}
          </nav>

          <div className={styles.footBrand}>
            Move<span className={styles.footAccent}>xa</span>
          </div>
          <p className={styles.footText}>
            Metadata &amp; artwork by TMDB. Streams provided by third-party embed sources.
            Movexa does not host any files.
          </p>
          <p className={styles.footCopy}>
            &copy; {new Date().getFullYear()} Movexa · Widescreen streaming, democratized
          </p>
        </div>
      </footer>

      {showModal && (
        <DetailModal
          key={`${route.params.type}-${route.params.id}`}
          type={route.params.type}
          id={route.params.id}
          onClose={() => {
            // Prefer going back so the previous page/scroll is restored;
            // fall back to home if there's no history entry.
            if (window.history.length > 1) window.history.back()
            else navigate(routes.home())
          }}
        />
      )}
    </div>
  )
}
