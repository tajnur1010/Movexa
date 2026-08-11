// Deprecated: the standalone TV page has been replaced by the unified
// <Browse world="series" />. Kept as a thin re-export for backwards-compat.
import React from 'react'
import Browse from './Browse.jsx'

export default function TV(props) {
  return <Browse world="series" {...props} />
}
