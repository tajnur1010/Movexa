// ─────────────────────────────────────────────────────────────
// Movexa — native (Capacitor) integration
//
// Everything here is a no-op in a normal browser, so the *same* web bundle
// runs unchanged on the website and inside the packaged Android app. Plugins
// are pulled in with dynamic import() wrapped in try/catch, so a missing or
// not-yet-installed plugin can never crash the site.
// ─────────────────────────────────────────────────────────────

import { canCloseToApp } from './router.js'

// True only inside the packaged Capacitor app (Android/iOS); false in any
// browser. The website uses this to HIDE the "Download APK" button when you're
// already running the app.
export function isNative() {
  return (
    typeof window !== 'undefined' &&
    !!window.Capacitor &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform()
  )
}

// Called once from main.jsx. Sets up the native chrome and hardware back
// button. Silently does nothing on the web.
export async function initNative() {
  if (!isNative()) return

  // Status bar — light icons on the app's dark surface, sitting above (not
  // overlapping) the web content so the header never hides under it.
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setOverlaysWebView({ overlay: false })
    await StatusBar.setStyle({ style: Style.Dark })
    try { await StatusBar.setBackgroundColor({ color: '#0b0d13' }) } catch {}
  } catch {}

  // Hardware back button — step back through in-app history (closes an open
  // detail modal too, since it's a history entry); exit the app on the root.
  try {
    const { App } = await import('@capacitor/app')
    App.addListener('backButton', () => {
      if (canCloseToApp()) window.history.back()
      else App.exitApp()
    })
  } catch {}

  // Hide the splash once React has painted. A short delay avoids a white flash
  // in the hand-off between the native splash and the first web frame.
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    setTimeout(() => { SplashScreen.hide().catch(() => {}) }, 250)
  } catch {}
}
