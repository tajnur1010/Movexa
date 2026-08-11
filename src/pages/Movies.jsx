// Deprecated: the standalone Movies page has been replaced by the unified
// <Browse world="movies" />. Kept as a thin re-export for backwards-compat.
import React from 'react'
import Browse from './Browse.jsx'

export default function Movies(props) {
  return <Browse world="movies" {...props} />
}
