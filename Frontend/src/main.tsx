import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Importiere React Hook Fallback für SES-Umgebungen
import './utils/reactHookFallback'

// Ersetze React-Hooks global für SES-Umgebungen
import { enableGlobalHookFallback, isSESEnvironment } from './utils/reactHookFallback'

// Prüfe auf SES-Umgebung und aktiviere Fallbacks
if (isSESEnvironment()) {
  console.warn('[Main] SES environment detected, enabling React hook fallbacks');
  enableGlobalHookFallback();
}
import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
