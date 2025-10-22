/**
 * React Hooks Polyfill
 * Ensures all React hooks are available globally and as named exports
 * This prevents "useEffect is not defined" errors in production builds
 */

import * as React from 'react';

// Export all hooks explicitly
export const {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
  useDeferredValue,
  useTransition,
  useId,
  useSyncExternalStore,
  useInsertionEffect
} = React;

// Ensure hooks are available globally
if (typeof window !== 'undefined') {
  const globalReact = (window as any).React || React;
  
  // Make sure all hooks are attached to the React object
  Object.assign(globalReact, {
    useState: React.useState,
    useEffect: React.useEffect,
    useContext: React.useContext,
    useReducer: React.useReducer,
    useCallback: React.useCallback,
    useMemo: React.useMemo,
    useRef: React.useRef,
    useImperativeHandle: React.useImperativeHandle,
    useLayoutEffect: React.useLayoutEffect,
    useDebugValue: React.useDebugValue,
    useDeferredValue: React.useDeferredValue,
    useTransition: React.useTransition,
    useId: React.useId,
    useSyncExternalStore: React.useSyncExternalStore,
    useInsertionEffect: React.useInsertionEffect
  });
  
  (window as any).React = globalReact;
}

export default React;

