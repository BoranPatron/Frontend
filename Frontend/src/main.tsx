import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Direkte React Hook Fallback-Implementierung für SES-Umgebungen
console.log('[Main] Checking React hooks availability...');

// Prüfe ob React-Hooks verfügbar sind
const checkReactHooks = () => {
  try {
    // Teste ob React-Hooks verfügbar sind
    if (!React.useState || !React.useEffect || !React.useRef) {
      console.warn('[Main] React hooks not available, creating fallbacks...');
      
      // Erstelle Fallback-Hooks
      if (!React.useState) {
        (React as any).useState = (initialState: any) => {
          console.warn('[React Hook Fallback] Using fallback for useState');
          let value = initialState;
          const setter = (newValue: any) => {
            value = newValue;
            // Trigger re-render simulation
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('react-state-change'));
            }
          };
          return [value, setter];
        };
      }
      
      if (!React.useEffect) {
        (React as any).useEffect = (effect: () => void | (() => void), deps?: React.DependencyList) => {
          console.warn('[React Hook Fallback] Using fallback for useEffect');
          // Führe den Effekt einmal aus
          const cleanup = effect();
          return cleanup;
        };
      }
      
      if (!React.useRef) {
        (React as any).useRef = (initialValue: any) => {
          console.warn('[React Hook Fallback] Using fallback for useRef');
          return { current: initialValue };
        };
      }
      
      if (!React.useCallback) {
        (React as any).useCallback = (callback: (...args: any[]) => any, deps?: React.DependencyList) => {
          console.warn('[React Hook Fallback] Using fallback for useCallback');
          return callback;
        };
      }
      
      if (!React.useMemo) {
        (React as any).useMemo = (factory: () => any, deps?: React.DependencyList) => {
          console.warn('[React Hook Fallback] Using fallback for useMemo');
          return factory();
        };
      }
      
      console.log('[Main] React hook fallbacks created successfully');
      
      // Mache React-Hooks auch über window verfügbar für globale Zugriffe
      if (typeof window !== 'undefined') {
        (window as any).ReactHooks = {
          useState: React.useState,
          useEffect: React.useEffect,
          useRef: React.useRef,
          useCallback: React.useCallback,
          useMemo: React.useMemo
        };
        console.log('[Main] React hooks made available via window.ReactHooks');
      }
    } else {
      console.log('[Main] React hooks are available');
      
      // Mache auch die originalen React-Hooks über window verfügbar
      if (typeof window !== 'undefined') {
        (window as any).ReactHooks = {
          useState: React.useState,
          useEffect: React.useEffect,
          useRef: React.useRef,
          useCallback: React.useCallback,
          useMemo: React.useMemo
        };
        console.log('[Main] Original React hooks made available via window.ReactHooks');
      }
    }
  } catch (error) {
    console.error('[Main] Error checking React hooks:', error);
  }
};

// Führe Hook-Check aus
checkReactHooks();

import { BrowserRouter } from 'react-router-dom'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
