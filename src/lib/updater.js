// ─────────────────────────────────────────────────────────────
// Movexa — in-app update check (Android)
//
// Two different things update, on two different tracks:
//
//   1. The WEBSITE (all the UI, players, ad-block domain logic in JS) — the APK
//      is a native shell pointed at the live site (capacitor.config.json →
//      server.url), so a Vercel deploy reaches every installed app instantly.
//      Nothing here is involved and the user does nothing.
//
//   2. The native SHELL itself (the ad-blocking WebViewClient + host list,
//      Capacitor plugins, icons, permissions). That code lives inside the APK,
//      so shipping it needs a new install. This module notices when a newer APK
//      has been published and lets <UpdateBanner /> offer it.
//
// Everything is best-effort and silent on failure: no network, GitHub rate
// limit, missing plugin or blocked storage must never break the app. On the web
// it's inert — checkForUpdate() resolves to null immediately.
// ─────────────────────────────────────────────────────────────

import { isNative } from './native.js'

// Stable "latest release" asset URL — always resolves to the newest APK
// published by .github/workflows/android.yml.
export const APK_URL =
  'https://github.com/tajnur1010/Movexa/releases/latest/download/movexa.apk'

const RELEASE_API =
  'https://api.github.com/repos/tajnur1010/Movexa/releases/latest'

// Unauthenticated GitHub API allows 60 requests/hour per IP. One check per 6h
// per device is far under that, and the answer is cached in between.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const CACHE_KEY = 'movexa:update:latest'
const DISMISS_KEY = 'movexa:update:dismissed'

// localStorage throws in some privacy modes / WebView configs — never let that
// propagate, just behave as if there's no cache.
function readStore(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* no-op */
  }
}

// Pull the build number out of a version string:
//   "v1.0.42" → 42 · "1.0.42" → 42 · "42" → 42 · "1.0" → 0
// The CI stamps versionCode/versionName from the workflow run number and tags
// the release "v1.0.<run>", so the trailing integer is the comparable part.
function buildNumber(value) {
  const match = String(value ?? '').match(/(\d+)(?!.*\d)/)
  return match ? parseInt(match[1], 10) : 0
}

// The installed app's build number. APKs built before version stamping report
// versionCode 1, so they read as "very old" and correctly see an update.
async function installedBuild() {
  try {
    const { App } = await import('@capacitor/app')
    const info = await App.getInfo()
    return {
      build: buildNumber(info.build) || buildNumber(info.version),
      version: info.version || '',
    }
  } catch {
    return null
  }
}

// Newest published release, from cache when it's still fresh.
async function latestRelease() {
  const cached = readStore(CACHE_KEY)
  if (cached) {
    try {
      const parsed = JSON.parse(cached)
      if (parsed && Date.now() - parsed.ts < CACHE_TTL_MS) return parsed
    } catch {
      /* fall through to a fresh fetch */
    }
  }

  try {
    const res = await fetch(RELEASE_API, {
      headers: { Accept: 'application/vnd.github+json' },
    })
    if (!res.ok) return null
    const data = await res.json()
    const tag = data.tag_name || ''
    if (!tag) return null
    const fresh = { ts: Date.now(), tag, build: buildNumber(tag) }
    writeStore(CACHE_KEY, JSON.stringify(fresh))
    return fresh
  } catch {
    return null
  }
}

/**
 * Resolves to update details when a newer APK exists, else null.
 * Shape: { current, latest, tag, url }
 */
export async function checkForUpdate() {
  if (!isNative()) return null

  const installed = await installedBuild()
  if (!installed) return null

  const latest = await latestRelease()
  if (!latest || !latest.build) return null

  // Not newer → nothing to offer.
  if (latest.build <= installed.build) return null

  // Respect a "Later" tap, but only for that specific version — the next
  // release asks again.
  if (readStore(DISMISS_KEY) === String(latest.build)) return null

  return {
    current: installed.version || String(installed.build),
    latest: latest.tag.replace(/^v/, ''),
    tag: latest.tag,
    url: APK_URL,
  }
}

/** Hide the prompt for this version only. */
export function dismissUpdate(update) {
  if (!update) return
  writeStore(DISMISS_KEY, String(buildNumber(update.tag)))
}
