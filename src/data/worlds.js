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
  chinese: {
    key: 'chinese',
    label: 'Chinese',
    tagline: 'C-dramas and Chinese cinema — wuxia to modern hits.',
    types: ['tv', 'movie'],
    base: { with_original_language: 'zh' },
  },
}

// Nav order shown in the header.
export const WORLD_ORDER = ['movies', 'series', 'anime', 'hollywood', 'bollywood', 'south', 'telugu', 'bangla', 'korean', 'chinese']

// Header layout, Netflix-style: a few primary links always visible, and the
// rest tucked into a grouped "Categories" dropdown so the bar stays clean.
export const PRIMARY_NAV = ['movies', 'series']
export const NAV_GROUPS = [
  { label: 'Indian Cinema', worlds: ['bollywood', 'south', 'telugu', 'bangla'] },
  { label: 'International', worlds: ['hollywood', 'korean', 'chinese', 'anime'] },
]

export const SORT_OPTIONS = [
  { value: 'popularity.desc', label: 'Popular' },
  { value: 'rating', label: 'Top Rated' }, // mapped to vote_average.desc + vote_count.gte
  { value: 'newest', label: 'Newest' },     // mapped to release/air date desc
  { value: 'revenue.desc', label: 'Box Office' },
]

// Resolve a UI sort value into concrete TMDB discover params for a media type.
export function resolveSort(sortValue, type) {
  switch (sortValue) {
    case 'rating':
      return { sort_by: 'vote_average.desc', 'vote_count.gte': 200 }
    case 'newest':
      return {
        sort_by: type === 'tv' ? 'first_air_date.desc' : 'primary_release_date.desc',
        'vote_count.gte': 10,
      }
    case 'revenue.desc':
      // Revenue sort only exists for movies; fall back for TV.
      return type === 'tv' ? { sort_by: 'popularity.desc' } : { sort_by: 'revenue.desc' }
    case 'popularity.desc':
    default:
      return { sort_by: 'popularity.desc' }
  }
}
