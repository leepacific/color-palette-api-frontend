# Build Info — color-palette-api frontend · Sprint 1

**Project**: color-palette-api frontend
**Sprint**: 1
**Branch**: master
**Date**: 2026-04-09
**Built by**: Frontend Works CTO (Mode A)
**Harness**: Frontend-Builder · design_philosophy_mode: on

## Stack

- **Framework**: React 18.3.1 + TypeScript 5.4
- **Bundler**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.4.3 + CSS custom properties (token layer)
  - Note: Lab spec called for Tailwind 4; Works used Tailwind 3 due to Tailwind
    4 stabilization concerns. Token layer is pure CSS vars so migration to
    Tailwind 4 `@theme` directive is mechanical. See
    `context/lead-reports/works/design-system-report.md` for rationale.
- **Routing**: React Router 6.22.3
- **State**: Zustand 4.5.2
- **Data mocking**: MSW 2.2.13 (toggleable via `VITE_USE_MSW` env var)
- **Fonts**: `@fontsource/jetbrains-mono` 5.0.21 + `@fontsource/ibm-plex-sans` 5.0.20
- **Icons**: lucide-react 0.365.0 (installed; not yet used — tree-shaken out)

## Install + build commands

```bash
cd C:/Users/sylio/Documents/Developer/projects/color-palette-api/frontend
npm install
npx msw init public/ --save   # once, to copy the MSW service worker script
npm run build                 # → dist/
npm run dev                   # local dev server on :5173
```

## Build output summary

| Asset | Raw | Gzipped |
|-------|-----|---------|
| index.html | 0.78 kB | 0.45 kB |
| assets/index-*.css | 43.07 kB | 19.45 kB |
| assets/index-*.js (main) | 208.09 kB | 65.09 kB |
| assets/browser-*.js (MSW, lazy) | 253.82 kB | 89.86 kB |

**Initial critical path (MSW off)**: ~85 kB gzipped.
**Initial critical path (MSW on, Sprint 1 default)**: ~175 kB gzipped.

Both are under the Tier 2 target of 200 kB.

## Env vars required

- `VITE_COLOR_PALETTE_API_BASE_URL` — Railway production URL (default in .env)
- `VITE_COLOR_PALETTE_API_DEV_KEY` — dev key (auto-seeded via FB-006)
- `VITE_USE_MSW` — `"true"` (default) | `"false"` to hit the live API

## TypeScript strict mode

`strict: true` in `tsconfig.json`. Build passes `tsc -b && vite build` cleanly
with no errors. 0 warnings.

## Directory layout

```
frontend/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── .env
├── public/
│   └── mockServiceWorker.js     # created by `npx msw init`
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── vite-env.d.ts
│   ├── components/
│   │   ├── ColorSwatch.tsx
│   │   ├── ComponentPreview.tsx
│   │   ├── ContrastMatrix.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── ExplainPanel.tsx
│   │   ├── ExportDrawer.tsx
│   │   ├── HelpOverlay.tsx
│   │   ├── JsonSidebar.tsx
│   │   ├── PaletteDisplay.tsx
│   │   ├── Toast.tsx
│   │   ├── TopBar.tsx
│   │   └── primitives/
│   │       ├── BlinkingCaret.tsx
│   │       └── KeycapHint.tsx
│   ├── hooks/
│   │   └── use-keyboard-shortcuts.ts
│   ├── lib/
│   │   ├── actions.ts
│   │   ├── api-client.ts
│   │   ├── color-math.ts
│   │   └── seed.ts
│   ├── mocks/
│   │   ├── browser.ts
│   │   ├── handlers.ts
│   │   └── stub-data.ts
│   ├── pages/
│   │   ├── GeneratorPage.tsx
│   │   ├── HelpPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── state/
│   │   └── store.ts
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css
│   └── types/
│       └── api.ts
└── dist/                        # build output
```

## Source line counts (approximate)

Total TS/TSX source: ~2400 lines.
Total CSS tokens: ~180 lines.

## Node/npm versions used

- Node: v22.17.0
- npm: 11.8.0
