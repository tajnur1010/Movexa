import React, { useState, useEffect, useRef } from 'react'
import { WORLD_ORDER, WORLDS } from '../data/worlds.js'
import { navigate, routes } from '../lib/router.js'
import { Logo, IconSearch, IconClose, IconMenu } from './Icons.jsx'
import styles from './Header.module.css'

export default function Header({ route }) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState(route?.params?.q || '')
  const inputRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Focus the box when it opens (no text selection — that showed an
  // unwanted highlight color inside the field).
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  // Keep the input in sync with the active search route, and keep the box
  // open on the results page so the query is always visible and editable.
  // Without this the box holds the first query forever and reopening it to
  // search again feels broken.
  useEffect(() => {
    if (route?.name === 'search') {
      setQ(route.params.q || '')
      setSearchOpen(true)
    }
  }, [route])

  useEffect(() => { setMenuOpen(false) }, [route])

  const activeWorld = route?.name === 'world' ? route.params.world : null
  const isHome = route?.name === 'home'

  function submitSearch(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(routes.search(term))
    inputRef.current?.blur()
  }

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <button className={styles.brand} onClick={() => navigate(routes.home())} aria-label="Movexa home">
          <Logo />
          <span className={styles.word}>Move<span className={styles.wordAccent}>xa</span></span>
        </button>

        <nav className={styles.nav} aria-label="Primary">
          <button
            className={`${styles.link} ${isHome ? styles.active : ''}`}
            onClick={() => navigate(routes.home())}
          >
            Home
          </button>
          {WORLD_ORDER.map(key => (
            <button
              key={key}
              className={`${styles.link} ${activeWorld === key ? styles.active : ''}`}
              onClick={() => navigate(routes.world(key))}
            >
              {WORLDS[key].label}
            </button>
          ))}
        </nav>

        <div className={styles.right}>
          <form className={`${styles.searchForm} ${searchOpen ? styles.searchOpen : ''}`} onSubmit={submitSearch}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search titles…"
              className={styles.searchInput}
              aria-label="Search"
            />
            <button type={searchOpen ? 'submit' : 'button'} className={styles.iconBtn}
              onClick={() => { if (!searchOpen) setSearchOpen(true) }} aria-label="Search">
              <IconSearch size={19} />
            </button>
            {searchOpen && (
              <button type="button" className={styles.clearBtn} onClick={() => { setSearchOpen(false); setQ('') }} aria-label="Close search">
                <IconClose size={16} />
              </button>
            )}
          </form>

          <button className={styles.menuBtn} onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          <button className={`${styles.mLink} ${isHome ? styles.active : ''}`} onClick={() => navigate(routes.home())}>Home</button>
          {WORLD_ORDER.map(key => (
            <button key={key} className={`${styles.mLink} ${activeWorld === key ? styles.active : ''}`} onClick={() => navigate(routes.world(key))}>
              {WORLDS[key].label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
