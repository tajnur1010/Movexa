import React, { useState, useEffect } from 'react'
import { checkForUpdate, dismissUpdate } from '../lib/updater.js'
import { IconDownload, IconClose } from './Icons.jsx'
import styles from './UpdateBanner.module.css'

// "Update available" prompt for the Android app.
//
// Renders nothing on the website, nothing when the app is current, and nothing
// if the check fails — so it is safe to mount unconditionally.
//
// Note this is only for updates to the native shell (ad blocker, plugins,
// permissions). Website changes reach the app on their own, because the APK
// loads the live site — see src/lib/updater.js for the full picture.
export default function UpdateBanner() {
  const [update, setUpdate] = useState(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Slight delay so the check never competes with the first paint / splash
    // hand-off on a cold start.
    const timer = setTimeout(() => {
      checkForUpdate()
        .then((found) => { if (!cancelled) setUpdate(found) })
        .catch(() => { /* stay hidden */ })
    }, 2500)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [])

  if (!update) return null

  function later() {
    dismissUpdate(update)
    setClosing(true)
    // Let the exit animation finish before unmounting.
    setTimeout(() => setUpdate(null), 200)
  }

  return (
    <div
      className={`${styles.wrap} ${closing ? styles.closing : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.icon} aria-hidden="true">
        <IconDownload size={20} />
      </div>

      <div className={styles.body}>
        <p className={styles.title}>App update available</p>
        <p className={styles.text}>
          Version {update.latest} is ready — it includes the latest ad-blocking
          and player fixes.
        </p>
      </div>

      <div className={styles.actions}>
        {/* An external link, so Capacitor hands it to the system browser, which
            downloads the APK and passes it to the installer. */}
        <a
          className={styles.update}
          href={update.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Update
        </a>
        <button type="button" className={styles.later} onClick={later}>
          Later
        </button>
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={later}
        aria-label="Dismiss update notice"
      >
        <IconClose size={15} />
      </button>
    </div>
  )
}
