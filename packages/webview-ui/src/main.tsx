import React from 'react'
import ReactDOM from 'react-dom/client'
import AppIntegrated from './AppIntegrated'
import './styles/globals.css'
import './styles/editor.css'
import './styles/blocks.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppIntegrated />
  </React.StrictMode>,
)