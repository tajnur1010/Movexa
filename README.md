# Movexa

A modern, cinematic movie & TV streaming site built with **React 18 + Vite**.
Widescreen ("CinemaScope"-inspired) UI with category worlds for **Anime, Hollywood,
Bollywood and Hindi**, a featured hero, horizontal browse rows, rich detail pages
(cast, trailer, similar titles), and an integrated embed player.

## Stack
- **React 18** + **Vite** (no extra runtime dependencies — routing is a tiny built-in hash router)
- **TMDB API** — metadata, posters, backdrops, cast, trailers, ratings
- **CodeSpecters Embed API** — the streaming player

## Setup

```bash
npm install
npm run dev      # start the dev server (Vite prints a localhost URL)
npm run build    # production build -> dist/
npm run preview  # preview the production build locally
```

> No Node.js locally? See **Deploy** below — you can build & host it without a local Node install.

## Configuration

Keys live in `src/lib/api.js` (unchanged from the original project):

```js
export const TMDB_KEY = 'your_tmdb_api_key'
export const EMBED_API_KEY = 'your_embed_key'
export const EMBED_BASE = 'https://api.codespecters.com'
```

Get a free TMDB key at https://www.themoviedb.org/settings/api

## Features
- **Cinematic hero** — auto-rotating featured titles in a 2.39:1 anamorphic frame with a signature lens-streak.
- **Home rows** — Trending Films, Popular Series, Anime Spotlight, Critically Acclaimed, Bollywood Hits, Hollywood Blockbusters. Each is a horizontal scroller.
- **Category worlds** — Movies, TV Series, Anime (Japanese animation), Hollywood (English), Bollywood (Hindi films) and Hindi. Each browse page has a Movies/Series toggle where relevant, genre filter chips, a sort menu (Popular / Top Rated / Newest / Box Office) and Load More paging.
- **Global search** — multi-search across movies & TV from the header.
- **Detail modal** — backdrop, synopsis, genres, runtime/seasons, cast, YouTube trailer, and a "More Like This" grid. Deep-linkable via the URL hash.
- **Player** — the embed iframe with a 16:9 cinematic frame; TV shows get a season/episode picker.
- **Polish** — sticky glass header, skeleton loaders, hover micro-interactions, keyboard focus states, reduced-motion support, and full mobile responsiveness with a hamburger menu.

## Design system
- **Palette:** near-black `#0b0d13` base, glass surfaces, warm marquee-glow accent (`#ffb23d → #ff5d5d`).
- **Type:** Sora (display), Inter (body/UI), Space Mono (film-spec labels).
- All tokens are CSS custom properties defined in `src/index.css`.

## Routing
Hash-based, no dependencies (`src/lib/router.js`):

```
#/                       Home
#/w/hollywood            Category world (movies | series | anime | hollywood | bollywood | hindi)
#/search/inception       Search results
#/title/movie/27205      Detail modal (overlays the current page)
```

## Project structure

```
src/
├── lib/
│   ├── api.js            # TMDB calls + embed/image URL helpers + normalize()
│   └── router.js         # tiny hash router (useHashRoute, navigate, routes)
├── data/
│   └── worlds.js         # category definitions + sort mapping
├── components/
│   ├── Header.jsx        # nav, worlds, expanding search, mobile menu
│   ├── Hero.jsx          # rotating featured banner
│   ├── Row.jsx           # horizontal scroller
│   ├── MediaCard.jsx     # poster card
│   ├── MediaGrid.jsx     # responsive grid + skeletons
│   ├── DetailModal.jsx   # cast / trailer / similar / play
│   ├── Player.jsx        # embed iframe frame
│   ├── SeasonPicker.jsx  # season tabs + episode list
│   └── Icons.jsx         # inline SVG icon set + logo
├── pages/
│   ├── Home.jsx          # hero + rows
│   ├── Browse.jsx        # unified category browse page
│   └── Search.jsx        # search results
├── App.jsx               # router wiring + global modal + footer
├── main.jsx
└── index.css             # theme tokens + global reset
```

## Deploy (public web)
The production build in `dist/` is fully static, so it hosts anywhere:
- **Netlify / Vercel / Cloudflare Pages / GitHub Pages** — connect the repo (or drag-and-drop the `dist/` folder). Build command `npm run build`, publish directory `dist`.
- Because routing is hash-based (`#/...`), no server rewrite rules are needed.

## Notes
Movexa stores no video files. Metadata and artwork come from TMDB; playback is served
by the third-party embed API configured in `src/lib/api.js`.
