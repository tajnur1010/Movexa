// Category "worlds" — each maps to a TMDB discover query.
// These power the top-nav destinations. The embed player + TMDB
// endpoints are reused as-is; only the discovery filters differ.

export const ANIME_GENRE = 16 // Animation (shared id for movie + tv)

export const WORLDS = {
  movies: {
    key: 'movies',
    label: 'Movies',
    tagline: 'Feature films from every corner of cinema.',
    types: ['movie'],
    base: {},
  },
  series: {
    key: 'series',
    label: 'TV Series',
    tagline: 'Bingeable shows, season by season.',
    types: ['tv'],
    base: {},
  },
  anime: {
    key: 'anime',
    label: 'Anime',
    tagline: 'Japanese animation — series and films.',
    types: ['tv', 'movie'],
    base: { with_genres: String(ANIME_GENRE), with_original_language: 'ja' },
  },
  hollywood: {
    key: 'hollywood',
    label: 'Hollywood',
    tagline: 'English-language blockbusters and classics.',
    types: ['movie', 'tv'],
    base: { with_original_language: 'en' },
  },
  bollywood: {
    key: 'bollywood',
    label: 'Bollywood',
    tagline: 'Hindi cinema — masala to arthouse.',
    types: ['movie'],
    base: { with_original_language: 'hi' },
  },
  south: {
    key: 'south',
    label: 'South Indian',
    tagline: 'Tamil blockbusters and beyond.',
    types: ['movie', 'tv'],
    base: { with_original_language: 'ta' },
  },
  telugu: {
    key: 'telugu',
    label: 'Telugu',
    tagline: 'Tollywood — action, drama and spectacle.',
    types: ['movie', 'tv'],
    base: { with_original_language: 'te' },
  },
  bangla: {
    key: 'bangla',
    label: 'Bangla',
    tagline: 'Bengali cinema — Kolkata to Dhaka.',
    types: ['movie', 'tv'],
    base: { with_original_language: 'bn' },
  },
  korean: {
    key: 'korean',
    label: 'Korean',
    tagline: 'K-dramas and Korean film, all in one place.',
    types: ['tv', 'movie'],
    base: { with_original_language: 'ko' },
  },
}

// Nav order shown in the header.
export const WORLD_ORDER = ['movies', 'series', 'anime', 'hollywood', 'bollywood', 'south', 'telugu', 'bangla', 'korean']

export const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' }, // mapped to vote_average.desc + vote_count.gte
  { value: 'newest',