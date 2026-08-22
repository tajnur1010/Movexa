import React, { useState, useEffect, useMemo } from 'react'
import styles from './Player.module.css'

// Cinematic embed frame with a multi-server fallback switcher.
// Props:
//   servers: [{ id, label, src }]  — preferred
//   src:     string                — legacy single-source fallback
//   label:   "Now playing" caption
export default function Player({ servers, src, label }) {
  // Normalise to a server list so the rest of the component is uniform.
  const list = useMemo(() => {
    if (Array.isArray(servers) && servers.length) return servers
    if (src) return [{ id: 'default', label: 'Server 1', src }]
    return []
  }, [servers, src])

  const [active, setActive] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // Reset to the first server + show the spinner whenever the sources change
  // (i.e. a new title/episode is selected).
  const key = list.map(s => s.src).join('|')
  useEffect(() => { setActive(0); setLoaded(false) }, [key])

  if (!list.length) return null
  const current = list[Math.min(active, list.length - 1)]

  function pick(i) {
    if (i === active) return
    setLoaded(false)
    setActive(i)
  }

  return (
    <div className={styles.wrap}>
      {list.length > 1 && (
        <div className={styles.servers} role="tablist" aria-label="Playback servers">
          {list.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              className={`${styles.server} ${i === active ? styles.serverActive : ''}`}
              onClick={() => pick(i)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className={styles.frame}>
        {!loaded && (
          <div className={styles.loading} aria-hidden="true">
            <span className={styles.reel} />
            <span className={styles.loadingText}>Loading stream…</span>
          </div>
        )}
        <iframe
          key={current.src}
          src={current.src}
          onLoad={() => setLoaded(true)}
          allowFullScreen
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          // Sandbox is per-server (see `sandbox` in api.js). Where it's applied,
          // withholding allow-popups / allow-top-navigation stops the new-tab
          // pop-unders and full-page redirect ads that hijack a click, while
          // scripts + same-origin (the player's own API/storage) and forms +
          // presentation (settings UI, fullscreen/cast) keep playback working.
          //
          // Servers that set `sandbox: false` won't play while sandboxed, so the
          // attribute is omitted entirely for them (React drops `undefined`) —
          // their pop-under/redirect ads can return on the website. Inside the
          // Android APK the native host blocklist still blocks the ad networks.
          //
          // Either way, overlay/banner ads *inside* the provider's frame sit on
          // their origin and can't be removed from our side.
          sandbox={
            current.sandbox === false
              ? undefined
              : 'allow-scripts allow-same-origin allow-forms allow-presentation'
          }
          title={label || 'Player'}
        />
      </div>

      <p className={styles.hint}>
        {label ? <span className={styles.nowPlaying}>{label}</span> : null}
        <span className={styles.tip}>
          Not playing? Try another server above. Use the player's own controls for
          quality, subtitles &amp; fullscreen. Sources are provided by third-party embeds.
        </span>
      </p>
    </div>
  )
}
