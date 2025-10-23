/**
 * React Hook Fallback für SES-Umgebungen
 * 
 * Dieses Modul stellt sicher, dass React-Hooks auch in SES-Umgebungen
 * (Secure EcmaScript) funktionieren, wo intrinsics entfernt werden.
 * 
 * Das Problem: SES entfernt JavaScript-Intrinsics, wodurch React-Hooks
 * zur Laufzeit nicht verfügbar sind, obwohl sie im Bundle enthalten sind.
 */

import React from 'react';

// Fallback-Hooks für SES-Umgebungen
let fallbackHooks: {
  useState: typeof React.useState;
  useEffect: typeof React.useEffect;
  useRef: typeof React.useRef;
  useCallback: typeof React.useCallback;
  useMemo: typeof React.useMemo;
  useContext: typeof React.useContext;
  useReducer: typeof React.useReducer;
  useLayoutEffect: typeof React.useLayoutEffect;
  useImperativeHandle: typeof React.useImperativeHandle;
  useDebugValue: typeof React.useDebugValue;
} | null = null;

/**
 * Initialisiert die Fallback-Hooks
 */
function initializeFallbackHooks() {
  if (fallbackHooks) return fallbackHooks;

  try {
    // Versuche normale React-Hooks zu verwenden
    fallbackHooks = {
      useState: React.useState,
      useEffect: React.useEffect,
      useRef: React.useRef,
      useCallback: React.useCallback,
      useMemo: React.useMemo,
      useContext: React.useContext,
      useReducer: React.useReducer,
      useLayoutEffect: React.useLayoutEffect,
      useImperativeHandle: React.useImperativeHandle,
      useDebugValue: React.useDebugValue,
    };
  } catch (error) {
    console.warn('[React Hook Fallback] React hooks not available, creating fallbacks:', error);
    
    // Erstelle Fallback-Hooks für SES-Umgebungen
    fallbackHooks = {
      useState: (initialState: any) => {
        console.warn('[React Hook Fallback] useState fallback used');
        return [initialState, () => {}];
      },
      useEffect: (effect: () => void | (() => void), deps?: any[]) => {
        console.warn('[React Hook Fallback] useEffect fallback used');
        try {
          effect();
        } catch (error) {
          console.error('[React Hook Fallback] useEffect error:', error);
        }
        return undefined;
      },
      useRef: (initialValue: any) => {
        console.warn('[React Hook Fallback] useRef fallback used');
        return { current: initialValue };
      },
      useCallback: (callback: (...args: any[]) => any, deps?: any[]) => {
        console.warn('[React Hook Fallback] useCallback fallback used');
        return callback;
      },
      useMemo: (factory: () => any, deps?: any[]) => {
        console.warn('[React Hook Fallback] useMemo fallback used');
        return factory();
      },
      useContext: (context: React.Context<any>) => {
        console.warn('[React Hook Fallback] useContext fallback used');
        return context._currentValue || context.defaultValue;
      },
      useReducer: (reducer: any, initialState: any) => {
        console.warn('[React Hook Fallback] useReducer fallback used');
        return [initialState, () => {}];
      },
      useLayoutEffect: (effect: () => void | (() => void), deps?: any[]) => {
        console.warn('[React Hook Fallback] useLayoutEffect fallback used');
        try {
          effect();
        } catch (error) {
          console.error('[React Hook Fallback] useLayoutEffect error:', error);
        }
        return undefined;
      },
      useImperativeHandle: (ref: any, init: () => any, deps?: any[]) => {
        console.warn('[React Hook Fallback] useImperativeHandle fallback used');
        if (ref && typeof ref === 'object') {
          Object.assign(ref, init());
        }
        return undefined;
      },
      useDebugValue: (value: any, formatter?: (value: any) => any) => {
        console.warn('[React Hook Fallback] useDebugValue fallback used');
        return undefined;
      },
    };
  }

  return fallbackHooks;
}

/**
 * Hook-Factory die automatisch zwischen normalen und Fallback-Hooks wechselt
 */
export function createSafeHook<T extends (...args: any[]) => any>(hookName: string, hook: T): T {
  return ((...args: any[]) => {
    try {
      const hooks = initializeFallbackHooks();
      return (hooks as any)[hookName](...args);
    } catch (error) {
      console.error(`[React Hook Fallback] Error with ${hookName}:`, error);
      
      // Fallback-Verhalten für kritische Hooks
      switch (hookName) {
        case 'useState':
          return [args[0], () => {}];
        case 'useEffect':
          try {
            args[0]?.();
          } catch (e) {
            console.error('[React Hook Fallback] useEffect fallback error:', e);
          }
          return undefined;
        case 'useRef':
          return { current: args[0] };
        default:
          return undefined;
      }
    }
  }) as T;
}

// Exportiere sichere Hook-Versionen
export const safeUseState = createSafeHook('useState', React.useState);
export const safeUseEffect = createSafeHook('useEffect', React.useEffect);
export const safeUseRef = createSafeHook('useRef', React.useRef);
export const safeUseCallback = createSafeHook('useCallback', React.useCallback);
export const safeUseMemo = createSafeHook('useMemo', React.useMemo);
export const safeUseContext = createSafeHook('useContext', React.useContext);
export const safeUseReducer = createSafeHook('useReducer', React.useReducer);
export const safeUseLayoutEffect = createSafeHook('useLayoutEffect', React.useLayoutEffect);
export const safeUseImperativeHandle = createSafeHook('useImperativeHandle', React.useImperativeHandle);
export const safeUseDebugValue = createSafeHook('useDebugValue', React.useDebugValue);

/**
 * Ersetzt React-Hooks global für SES-Umgebungen
 * 
 * WARNUNG: Dies sollte nur als letzter Ausweg verwendet werden!
 */
export function enableGlobalHookFallback() {
  if (typeof window !== 'undefined') {
    console.warn('[React Hook Fallback] Enabling global hook fallback for SES environments');
    
    // Ersetze React-Hooks global
    try {
      const hooks = initializeFallbackHooks();
      
      // Ersetze React-Hooks
      (React as any).useState = hooks.useState;
      (React as any).useEffect = hooks.useEffect;
      (React as any).useRef = hooks.useRef;
      (React as any).useCallback = hooks.useCallback;
      (React as any).useMemo = hooks.useMemo;
      (React as any).useContext = hooks.useContext;
      (React as any).useReducer = hooks.useReducer;
      (React as any).useLayoutEffect = hooks.useLayoutEffect;
      (React as any).useImperativeHandle = hooks.useImperativeHandle;
      (React as any).useDebugValue = hooks.useDebugValue;
      
      // Ersetze auch die globalen Hook-Referenzen
      if (typeof window !== 'undefined') {
        (window as any).React = React;
        (window as any).useState = hooks.useState;
        (window as any).useEffect = hooks.useEffect;
        (window as any).useRef = hooks.useRef;
        (window as any).useCallback = hooks.useCallback;
        (window as any).useMemo = hooks.useMemo;
        (window as any).useContext = hooks.useContext;
        (window as any).useReducer = hooks.useReducer;
        (window as any).useLayoutEffect = hooks.useLayoutEffect;
        (window as any).useImperativeHandle = hooks.useImperativeHandle;
        (window as any).useDebugValue = hooks.useDebugValue;
      }
      
      console.log('[React Hook Fallback] Global hooks replaced successfully');
    } catch (error) {
      console.error('[React Hook Fallback] Failed to replace global hooks:', error);
    }
  }
}

/**
 * Prüft ob wir in einer SES-Umgebung sind
 */
export function isSESEnvironment(): boolean {
  try {
    // Prüfe auf SES-spezifische Eigenschaften
    const hasIntrinsicsRemoved = (
      // SES entfernt intrinsics
      !Object.prototype.hasOwnProperty.call(Object.prototype, 'hasOwnProperty') ||
      // SES entfernt globale Objekte
      typeof Map === 'undefined' ||
      typeof WeakMap === 'undefined' ||
      typeof Date === 'undefined' ||
      // SES entfernt Prototypen
      !Object.prototype.toString ||
      // SES entfernt Konstruktoren
      typeof Object === 'undefined' ||
      typeof Array === 'undefined'
    );

    // Prüfe auf React-Hook-Verfügbarkeit
    const reactHooksAvailable = (
      typeof React !== 'undefined' &&
      React.useState &&
      React.useEffect &&
      React.useRef
    );

    // Wenn intrinsics entfernt wurden ODER React-Hooks nicht verfügbar sind
    return hasIntrinsicsRemoved || !reactHooksAvailable;
  } catch (error) {
    console.warn('[React Hook Fallback] Error checking SES environment:', error);
    return true; // Wenn wir einen Fehler bekommen, sind wir wahrscheinlich in SES
  }
}

/**
 * Automatische Aktivierung für SES-Umgebungen
 */
if (typeof window !== 'undefined' && isSESEnvironment()) {
  console.warn('[React Hook Fallback] SES environment detected, enabling fallbacks');
  enableGlobalHookFallback();
}

export default {
  safeUseState,
  safeUseEffect,
  safeUseRef,
  safeUseCallback,
  safeUseMemo,
  safeUseContext,
  safeUseReducer,
  safeUseLayoutEffect,
  safeUseImperativeHandle,
  safeUseDebugValue,
  enableGlobalHookFallback,
  isSESEnvironment,
};
