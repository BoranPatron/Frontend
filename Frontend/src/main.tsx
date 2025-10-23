import * as React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupChartErrorHandling } from './utils/chartErrorHandling'

// KRITISCH: Mache React global verfügbar BEVOR irgendetwas anderes geladen wird
// Dies verhindert "useEffect is not defined" Fehler in Production
if (typeof window !== 'undefined') {
  (window as any).React = React;
  
  // Stelle sicher dass alle React-Hooks verfügbar sind
  const ensureHooksAvailable = () => {
    // Wenn React-Hooks fehlen, erstelle Fallbacks
    if (!React.useState) {
      (React as any).useState = (initialState: any) => {
        let value = initialState;
        const setter = (newValue: any) => { value = newValue; };
        return [value, setter];
      };
    }
    
    if (!React.useEffect) {
      (React as any).useEffect = (effect: () => void | (() => void), deps?: any) => {
        try {
          const cleanup = effect();
          return cleanup;
        } catch (e) {
          // Ignoriere Fehler im Fallback
        }
      };
    }
    
    if (!React.useRef) {
      (React as any).useRef = (initialValue: any) => ({ current: initialValue });
    }
    
    if (!React.useCallback) {
      (React as any).useCallback = (callback: any, deps?: any) => callback;
    }
    
    if (!React.useMemo) {
      (React as any).useMemo = (factory: () => any, deps?: any) => factory();
    }
  };
  
  // Stelle sicher dass Hooks verfügbar sind
  ensureHooksAvailable();
  
  // Exportiere React-Hooks auch direkt über window für maximale Kompatibilität
  (window as any).useState = React.useState;
  (window as any).useEffect = React.useEffect;
  (window as any).useRef = React.useRef;
  (window as any).useCallback = React.useCallback;
  (window as any).useMemo = React.useMemo;
  
  // Setup Chart Error Handling global
  setupChartErrorHandling();
}

import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
