import React, { useState, useEffect, useRef } from 'react'
import { WORLDS, PRIMARY_NAV, NAV_GROUPS } from '../data/worlds.js'
import { navigate, routes, onNavClick } from '../lib/router.js'
import { isNative } from '../lib/native.js'
import { Logo, IconSearch, IconClose, IconMenu, IconChevronD, IconDownload } from './Icons.jsx'
import styles from './Header.module.css'

// Direct link to the latest Android build published by the GitHub Actions
// workflow (.github/workflows/android.yml → GitHub Release asset "movexa.apk").
// `releases/latest/download/…` always resolves to the newest published release.
export const APK_URL = 'https://github.com/tajnur1010/Movexa/releases/latest/download/movexa.apk'

export default function Header({ route }) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [q, setQ] = useState(route?.params?.q || '')
  const inputRef = useRef(null)
  const catRef = useRef(null)

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
  useEffect(() => {
    if (route?.name === 'search') {
      setQ(route.params.q || '')
      setSearchOpen(true)
    }
  }, [route])

  // Close menus whenever the route changes.
  useEffect(() => { setMenuOpen(false); setCatOpen(false) }, [route])

  // Close the categories dropdown on outside click / Escape.
  useEffect(() => {
    if (!catOpen) return
    const onDoc = (e) => { if (catRef.current && !catRef.current.contains(e.target)) setCatOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setCatOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [catOpen])

  const activeWorld = route?.name === 'world' ? route.params.world : null
  const isHome = route?.name === 'home'
  // Is the current world one that lives inside the Categories dropdown?
  const inCategories = activeWorld && !PRIMARY_NAV.includes(activeWorld)

  function submitSearch(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(routes.search(term))
    inputRef.current?.blur()
  }

  // Inside the packaged app there's no point offering the APK — hide it there.
  const nativeApp = isNative()

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        <a className={styles.brand} href={routes.home()} onClick={(e) => onNavClick(e, () => navigate(routes.home()))} aria-label="Movexa home">
          <Logo />
          <span className={styles.word}>Move<span className={styles.wordAccent}>xa</span></span>
        </a>

        <nav className={styles.nav} aria-label="Primary">
          <a
            className={`${styles.link} ${isHome ? styles.active : ''}`}
            href={routes.home()}
            onClick={(e) => onNavClick(e, () => navigate(routes.home()))}
          >
            Home
          </a>

          {PRIMARY_NAV.map(key => (
            <a
              key={key}
              className={`${styles.link} ${activeWorld === key ? styles.active : ''}`}
              href={routes.world(key)}
              onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}
            >
              {WORLDS[key].label}
            </a>
          ))}

          <div className={styles.catWrap} ref={catRef}>
            <button
              className={`${styles.link} ${styles.catTrigger} ${inCategories ? styles.active : ''} ${catOpen ? styles.catTriggerOpen : ''}`}
              onClick={() => setCatOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={catOpen}
            >
              Categories <IconChevronD size={15} />
            </button>

            {catOpen && (
              <div className={styles.dropdown} role="menu">
                {NAV_GROUPS.map(group => (
                  <div key={group.label} className={styles.dropGroup}>
                    <span className={styles.dropGroupLabel}>{group.label}</span>
                    {group.worlds.map(key => (
                      <a
                        key={key}
                        role="menuitem"
                        className={`${styles.dropItem} ${activeWorld === key ? styles.dropItemActive : ''}`}
                        href={routes.world(key)}
                        onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}
                      >
                        {WORLDS[key].label}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className={styles.right}>
          {!nativeApp && (
            <a
              className={styles.apkBtn}
              href={APK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download the Movexa Android app (APK)"
            >
              <IconDownload size={17} />
              <span className={styles.apkBtnText}>Get App</span>
            </a>
          )}

          <form className={`${styles.searchForm} ${searchOpen ? styles.searchOpen : ''}`} onSubmit={submitSearch}>
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search titles…"
              className={styles.searchInput}
              aria-label="Search"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
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
          <a className={`${styles.mLink} ${isHome ? styles.active : ''}`} href={routes.home()} onClick={(e) => onNavClick(e, () => navigate(routes.home()))}>Home</a>
          {PRIMARY_NAV.map(key => (
            <a key={key} className={`${styles.mLink} ${activeWorld === key ? styles.active : ''}`} href={routes.world(key)} onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}>
              {WORLDS[key].label}
            </a>
          ))}
          {NAV_GROUPS.map(group => (
            <div key={group.label} className={styles.mGroup}>
              <span className={styles.mGroupLabel}>{group.label}</span>
              {group.worlds.map(key => (
                <a key={key} className={`${styles.mLink} ${activeWorld === key ? styles.active : ''}`} href={routes.world(key)} onClick={(e) => onNavClick(e, () => navigate(routes.world(key)))}>
                  {WORLDS[key].label}
                </a>
              ))}
            </div>
          ))}

          {!nativeApp && (
            <a
              className={styles.mApkLink}
              href={APK_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconDownload size={18} />
              Download Android App
            </a>
          )}
        </div>
      )}
    </header>
  )
}
