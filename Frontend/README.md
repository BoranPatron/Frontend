# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Netzwerk-Zugriff konfigurieren

### Frontend über Netzwerk erreichbar machen

Das Frontend ist bereits so konfiguriert, dass es über das lokale Netzwerk erreichbar ist:

1. **Frontend starten:**
   ```bash
   npm run dev
   ```

2. **IP-Adresse ermitteln:**
   - Windows: `ipconfig` in der Kommandozeile
   - Mac/Linux: `ifconfig` oder `ip addr` im Terminal
   - Suchen Sie nach Ihrer lokalen IP (meist 192.168.x.x oder 10.x.x.x)

3. **Zugriff von anderen Geräten:**
   - Verwenden Sie: `http://IHRE_IP_ADRESSE:5173`
   - Beispiel: `http://192.168.1.100:5173`

### Backend für Netzwerk-Zugriff konfigurieren

Das Backend muss ebenfalls für Netzwerk-Zugriff konfiguriert werden:

1. **Backend mit Netzwerk-Host starten:**
   ```bash
   cd BuildWise
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Firewall-Einstellungen:**
   - Windows: Erlauben Sie Vite und Python in der Windows-Firewall
   - Mac: Erlauben Sie eingehende Verbindungen für Terminal/VS Code

### Sicherheitshinweise

- Diese Konfiguration ist nur für lokale Entwicklung gedacht
- Verwenden Sie in Produktionsumgebungen HTTPS und entsprechende Sicherheitsmaßnahmen
- Beschränken Sie den Netzwerk-Zugriff auf vertrauenswürdige Geräte

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
