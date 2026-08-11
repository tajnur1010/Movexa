import React from 'react'

// Lightweight inline icon set (stroke-based, currentColor).
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconPlay = ({ size = 20, filled = true }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
    fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} strokeWidth="1.8">
    <path d="M8 5v14l11-7z" />
  </svg>
)

export const IconSearch = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
)

export const IconStar = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.11 6.47L12 17.98 6.19 21.5l1.1-6.47L2.6 10.45l6.5-.95z" />
  </svg>
)

export const IconClose = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconChevronR = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconChevronL = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)

export const IconInfo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
)

export const IconDownload = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M12 3v12M7 10l5 5 5-5" />
    <path d="M4 21h16" />
  </svg>
)

export const IconMenu = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...S}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

// Wordmark: an anamorphic aperture bracket + "Movexa"
export const Logo = () => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect x="1.5" y="6.5" width="21" height="11" rx="2.5" stroke="url(#lg)" strokeWidth="1.8" />
      <path d="M7.5 10.5v3M16.5 10.5v3" stroke="url(#lg)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.2" fill="url(#lg)" />
      <defs>
        <linearGradient id="lg" x1="2" y1="6" x2="22" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffb23d" />
          <stop offset="1" stopColor="#ff5d5d" />
        </linearGradient>
      </defs>
    </svg>
  </span>
)
