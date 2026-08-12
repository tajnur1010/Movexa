import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { redirectLegacyHash } from './lib/router.js'
import './index.css'

// Migrate any old #/… links to clean paths before the app reads the URL.
redirectLegacyHash()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
