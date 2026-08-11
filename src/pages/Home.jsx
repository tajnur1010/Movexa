import React, { useState, useEffect } from 'react'
import { api, normalize } from '../lib/api.js'
import Hero from '../components/Hero.jsx'
import Row from '../components/Row.jsx'
import { ANIME_GENRE } from '../data/worlds.js'
import styles from './Home.module.css'

const mapList = (d, type) => (d?.results || []).map(x => normalize(x, type)).filter(Boolean)

export default function Home({ onSelect }) {
  const [hero, setHero] = useState([])
  const [rows, setRows] = useState({})
  const [heroLoading, setHeroLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    // Hero: trending mix with good backdrops
    api.trendingAll()
      .then(d => {
        if (cancelled) return
        setHero(mapList(d).filter(i => i.backdrop && i.overview))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setHeroLoading(false) })

    // Rows load independently so the page fills in progressively
    const jobs = [
      ['trendingMovies', 'Trending Films', 'This Week', api.trendingMovies(), 'movie'],
      ['popularTV', 'Popular Series', 'Binge-worthy', api.popularTV(), 'tv'],
      ['topRatedMovies', 'Critically Acclaimed', 'Top Rated', api.topRatedMovies(), 'movie'],
      ['anime', 'Anime Spotlight', 'From Japan', api.discoverTV({ with_genres: String(ANIME_GENRE), with_original_language: 'ja', sort_by: 'popularity.desc' }), 'tv'],
      ['south', 'South Indian Hits', 'தமிழ்', api.discoverMovies({ with_original_language: 'ta', sort_by: 'popularity.desc', 'vote_count.gte': 50 }), 'movie'],
      ['telugu', 'Telugu Blockbusters', 'తెలుగు', api.discoverMovies({ with_original_language: 'te', sort_by: 'popularity.desc', 'vote_count.gte': 40 }), 'movie'],
      ['bollywood', 'Bollywood Hits', 'हिन्दी', api.discoverMovies({ with_original_language: 'hi', sort_by: 'popularity.desc' }), 'movie'],
      ['bangla', 'Bengali Cinema', 'বাংলা', api.discoverMovies({ with_original_language: 'bn', sort_by: 'popularity.desc', 'vote_count.gte': 10 }), 'movie'],
      ['korean', 'Korean Wave', '한국', api.discoverTV({ with_original_language: 'ko', sort_by: 'popularity.desc', 'vote_count.gte': 30 }), 'tv'],
      ['hollywood', 'Hollywood Blockbusters', 'English', api.discoverMovies({ with_original_language: 'en', sort_by: 'popularity.desc', 'vote_count.gte': 300 }), 'movie'],
    ]

    jobs.forEach(([key, title, eyebrow, promise, type]) => {
      promise
        .then(d => {
          if (cancelled) return
          setRows(prev => ({ ...prev, [key]: { title, eyebrow, items: mapList(d, type) } }))
        })
        .catch(() => {})
    })

    return () => { cancelled = true }
  }, [])

  const order = ['trendingMovies', 'popularTV', 'anime', 'south', 'telugu', 'topRatedMovies', 'bollywood', 'bangla', 'korean', 'hollywood']

  return (
    <div className={styles.page}>
      <Hero
        items={heroLoading ? [] : hero}
        onPlay={onSelect}
        onInfo={onSelect}
      />

      <div className={styles.rows}>
        {order.map(key => {
          const row = rows[key]
          return (
            <Row
              key={key}
              title={row?.title || ' '}
              eyebrow={row?.eyebrow}
              items={row?.items || []}
              loading={!row}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
