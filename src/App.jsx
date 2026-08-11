import React, { useRef } from 'react'
import { useHashRoute, navigate, routes } from './lib/router.js'
import Header from './components/Header.jsx'
import DetailModal from './components/DetailModal.jsx'
import Home from './pages/Home.jsx'
import Browse from './pages/Browse.jsx'
import Search from './pages/Search.jsx'
import { WORLDS } from './data/worlds.js'
import styles from './App.module.css'

export default function App() {
  const route = useHashRoute()

  // Remember the last non-modal route so the page behind the detail
  // modal stays put instead of flashing back to Home.
  const bgRef = useRef({ name: 'home', params: {} })
  if (route.name !== 'title') bgRef.current = route
  const bg = route.name === 'title' ? bgRef.current : route

  const showModal = route.name === 'title' && route.params.id

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
          <div className={styles.footBrand}>
            Move<span className={styles.footAccent}>xa</span>
          </div>
          <p className={styles.footText}>
            Metadata &amp; artwork by TMDB. Streams provided by third-party embed sources.
            Movexa does not host any files.
          </p>
          <p className={styles.footCopy}>
            &copy; {new Date().getFullYear()} Movexa · Widescreen streaming, democratized ·{' '}
            <a href="https://www.codespecters.com/" target="_blank" rel="noopener noreferrer" className={styles.footLink}>
              Code Specter
            </a>
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
