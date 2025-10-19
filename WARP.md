# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Repository overview

- This repo contains a React + TypeScript + Vite application located in Frontend/.
- There is also a package.json at the repository root, but all build/dev/lint configuration files (vite.config.ts, eslint.config.js, tsconfig.* and index.html) live under Frontend/. Run commands from Frontend/ unless you explicitly know you want the top-level package.json.

Common commands (run from Frontend/)

- Install dependencies
  - PowerShell: cd .\Frontend; npm install
- Start dev server (LAN-accessible)
  - npm run dev
  - Vite is configured to listen on 0.0.0.0:5173, so you can open http://<your_lan_ip>:5173 on other devices.
- Build
  - npm run build
  - Produces a production build with source maps and cache-busted asset names (dist/).
- Preview the production build
  - npm run preview
- Lint (ESLint v9 flat config)
  - npm run lint
- Tests
  - No test runner is configured (no Jest/Vitest scripts or configs present). Single-test execution not applicable.

Backend and proxy notes

- Dev-time proxy: Frontend/vite.config.ts proxies /api to http://192.168.1.65:8000. Change the target there if your backend address differs.
- Runtime API base URL: src/api/api.ts computes it from window.location.hostname and port 8000. On localhost it uses http://localhost:8000/api/v1; on LAN it targets http://<host>:8000/api/v1.
- README guidance: The project’s Frontend/README.md includes steps to run the backend with network access (uvicorn app on 0.0.0.0:8000) and notes about allowing firewall access. Follow those when doing LAN testing.

High-level architecture

- Entry and routing
  - src/main.tsx bootstraps BrowserRouter and renders App.
  - App wraps ErrorBoundary, AuthProvider, and ProjectProvider around AppContent.
  - Routing is defined in App.tsx with a ProtectedRoute gate that delays until auth initialization, redirects unauthenticated users to /login, and shows onboarding (role/company address) modals when required.
  - Navbar is conditionally rendered (hidden on /login and until auth is ready). Numerous authenticated routes exist (/, /service-provider, /global-projects, /project/:id, /finance, /canvas, /geo-search, etc.).

- State and context
  - AuthContext (src/context/AuthContext.tsx):
    - Manages token and user from localStorage, validates JWTs, supports role selection, and exposes helpers (isAuthenticated, isServiceProvider, isBautraeger).
    - Performs a fresh user fetch on startup (users/me). Some endpoints are hardcoded to http://localhost:8000; keep this in mind for LAN testing.
  - ProjectContext (src/context/ProjectContext.tsx):
    - Loads projects for authenticated users, tracks selected project and persists selection in localStorage.

- API layer and caching
  - src/api/api.ts: Axios instance with request/response interceptors, auth header injection, safeApiCall (waits for auth), robust 401 handling with redirect to /login, and getAuthenticatedFileUrl helper.
  - src/api/cachedApiClient.ts: Higher-level client that applies endpoint-specific TTLs, GET result caching, and cache invalidation on mutations (POST/PUT/PATCH/DELETE). Exposes window.__apiClient debug helpers in development.
  - Caching core: src/utils/cacheManager.ts provides a localStorage-backed cache with TTLs, versioning keyed off __BUILD_TIME__, prefix invalidation, and window.__cacheManager dev helpers.

- Service worker integration
  - src/utils/serviceWorkerManager.ts registers /sw.js only in production, provides messaging to clear/invalidate caches, and exposes window.__serviceWorker helpers in development.

- UI composition
  - Pages under src/pages represent the main feature areas (Dashboard, ProjectDetail, Finance, Canvas, GeoSearch, Messages, etc.).
  - Shared components live in src/components (including a Canvas/ submodule for advanced canvas interactions, notifications, modals, dashboards, and utilities like CacheDebugPanel and RadialMenuAdvanced).
  - Global styles at src/index.css and styles/grid-optimizations.css; FontAwesome CSS is imported in main.

- Tooling
  - Vite (Frontend/vite.config.ts): React plugin with Fast Refresh, Windows-friendly file watching (polling), LAN hosting, CORS enabled, proxy for /api, and build output hashing. Defines globals __BUILD_TIME__ and __DEV__.
  - ESLint (Frontend/eslint.config.js): Flat config using @eslint/js + typescript-eslint recommended, react-hooks, and react-refresh rules. Targets TS/TSX files with browser globals.

Additional notes for Warp

- Always run build/dev/lint from the Frontend/ directory to use the correct configs.
- For LAN testing, verify both the Vite proxy target and the runtime base URL behavior in src/api/api.ts align with your backend address.
