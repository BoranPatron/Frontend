/**
 * Vite Plugin: Convert React Named Imports to Namespace Imports
 * 
 * Converts: import { useEffect, useState } from 'react'
 * To: import React from 'react'
 * And: useEffect(...) -> React.useEffect(...)
 * 
 * This ensures React hooks are ALWAYS available in production builds
 */

import type { Plugin } from 'vite';

export function reactNamespacePlugin(): Plugin {
  return {
    name: 'vite-plugin-react-namespace',
    enforce: 'pre',
    
    transform(code: string, id: string) {
      // Only transform TypeScript/JavaScript files, not node_modules
      if (!/\.(tsx?|jsx?)$/.test(id) || id.includes('node_modules')) {
        return null;
      }

      // Skip if no React imports
      if (!code.includes('from \'react\'') && !code.includes('from "react"')) {
        return null;
      }

      let transformedCode = code;
      
      // List of all React hooks and common exports
      const reactExports = [
        'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 
        'useMemo', 'useRef', 'useImperativeHandle', 'useLayoutEffect', 
        'useDebugValue', 'useDeferredValue', 'useTransition', 'useId',
        'useSyncExternalStore', 'useInsertionEffect',
        'Component', 'PureComponent', 'memo', 'forwardRef', 'createContext',
        'createElement', 'cloneElement', 'isValidElement', 'Children',
        'Fragment', 'StrictMode', 'Suspense', 'lazy'
      ];

      // Find named imports from React
      const namedImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react['"]/g;
      const matches = [...transformedCode.matchAll(namedImportRegex)];
      
      if (matches.length === 0) {
        return null;
      }

      // Extract all imported names
      const importedNames = new Set<string>();
      matches.forEach(match => {
        const imports = match[1].split(',').map(s => {
          const parts = s.trim().split(/\s+as\s+/);
          return parts[0].trim();
        });
        imports.forEach(name => importedNames.add(name));
      });

      // Remove named imports and ensure default import exists
      transformedCode = transformedCode.replace(namedImportRegex, '');
      
      // Add default React import if not present
      if (!transformedCode.match(/import\s+React\s+from\s+['"]react['"]/)) {
        transformedCode = `import React from 'react';\n${transformedCode}`;
      }

      // Replace all usage of named imports with React.xxx
      importedNames.forEach(name => {
        if (reactExports.includes(name)) {
          // Match the name as a whole word (not part of another identifier)
          const usageRegex = new RegExp(`\\b${name}\\b`, 'g');
          transformedCode = transformedCode.replace(usageRegex, `React.${name}`);
        }
      });

      return {
        code: transformedCode,
        map: null
      };
    }
  };
}

