
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ConnectionWarmup } from './utils/connectionWarmup'
import { LanguageProvider } from './contexts/LanguageContext'

// Start connection warmup as early as possible
ConnectionWarmup.warmupConnection().catch(console.warn);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
)
