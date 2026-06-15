# aniannoth-overview — Agent Context

> Project-level context for AI agents operating in aniannoth-overview.
> Always read ARCHITECTURE.md at the workspace root before reading this file.

---

## What this project is

A React + TypeScript web application for exploring the Keynor universe. Acts as an interactive atlas — Phase 2 (current): consumes the keynor-core REST API as its exclusive data source.

---

## Stack

| Concern | Technology |
|---------|------------|
| Framework | React 19 (TypeScript) |
| Build tool | Vite 8 |
| Routing | React Router v7 (`react-router-dom`) |
| State management | Context API — no Redux |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite` plugin) |
| Components | shadcn/ui — new-york style |
| Icons | Lucide React |
| Map rendering | Leaflet.js (`react-leaflet`) |
| Markdown rendering | `react-markdown` |
| Data source | keynor-core REST API (`/api/public/v1/`) |

**shadcn/ui note:** the CLI (`npx shadcn init`) has a known bug with Tailwind v4 as of May 2026. Setup was done manually. To add components, use `npx shadcn@latest add [component]` — the `add` command works correctly.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_LOG_LEVEL` | `error` | Controls the minimum log level emitted by `src/lib/logger.ts`. Valid values: `debug`, `info`, `warn`, `error`. Set to `debug` or `info` in `.env.local` for local development. Never committed. See `.claude/skills/logging-conventions.md`. |

---

## Project structure

```
aniannoth-overview/
├── src/
│   ├── components/
│   │   ├── TopBar.tsx        ← global navigation bar (Zone 1)
│   │   ├── TimelineBar.tsx   ← era selector track (Zone 2)
│   │   ├── MapArea.tsx       ← map surface + overlays (Zone 3 left)
│   │   ├── Sidebar.tsx       ← entity list + filters (Zone 3 right)
│   │   ├── DetailPanel.tsx   ← entity detail view (Zone 4)
│   │   ├── ErrorBoundary.tsx ← root-level React error boundary (wraps App in main.tsx)
│   │   └── ui/               ← shadcn/ui components (added via CLI as needed)
│   ├── context/
│   │   └── AppContext.tsx    ← global state provider and useAppContext hook
│   ├── hooks/
│   │   ├── useEras.ts        ← returns Era[]
│   │   ├── useMaps.ts        ← returns GameMap[]
│   │   └── useEntities.ts    ← useEntities(category), useAllEntities()
│   ├── pages/
│   │   ├── ExplorePage.tsx   ← /explore — full atlas layout
│   │   ├── CharactersPage.tsx
│   │   ├── PlacesPage.tsx
│   │   ├── ItemsPage.tsx
│   │   └── LorePage.tsx
│   ├── types/
│   │   └── universe.ts       ← Era, GameMap, Entity, EntityTimeline interfaces
│   ├── lib/
│   │   ├── utils.ts          ← cn() utility (clsx + tailwind-merge)
│   │   └── logger.ts         ← level-controlled logger wrapping console.*, reads VITE_LOG_LEVEL
│   ├── test/
│   │   └── setup.ts          ← Vitest globals + @testing-library/jest-dom
│   ├── App.tsx               ← router shell, global layout
│   ├── main.tsx
│   └── index.css             ← Tailwind import + project CSS variables
├── .claude/
│   ├── CLAUDE.md             ← this file
│   ├── universe-glossary.md  ← shared universe terminology (read by Lethra and Aroneus)
│   └── agents/
│       ├── aniannoth.md      ← Level 3 architect for this project
│       ├── gen-esir.md       ← Level 2 React/TypeScript developer (owns src/)
│       ├── syde.md           ← Level 2 Playwright test engineer (owns tests/e2e/)
│       ├── aroneus.md        ← Level 2 content author (structures and submits content via keynor-core API)
│       └── lethra.md         ← Level 1 literary scribe (produces descriptive text)
├── components.json           ← shadcn/ui configuration
└── package.json
```

**Path alias:** `@/` resolves to `src/`. Use `@/components/...`, `@/lib/utils`, etc.

---

## Global state

```typescript
interface AppState {
  selectedEra: string;
  selectedMap: string;
  selectedEntityId: string | null;  // entity selected in Sidebar, displayed in DetailPanel
  filters: {
    category: string | null;  // 'characters' | 'places' | 'items' | 'events' | null
    tags: string[];
  };
}
```

Managed via `AppContext` (`src/context/AppContext.tsx`). Full API:

```typescript
interface AppContextValue extends AppState {
  setEra: (eraId: string) => void
  setMap: (mapId: string) => void
  setFilter: (category: string | null) => void
  setSelectedEntity: (id: string | null) => void
  mapResetTriggered: boolean           // true when an era change forced a map reset
  clearMapResetTrigger: () => void     // called by MapArea after showing the toast
  eraDetailOpen: boolean               // true when DetailPanel is showing era info
  setEraDetailOpen: (open: boolean) => void
}
```

Era change logic: if the current map does not exist in the new era, `setEra` resets `selectedMap` to the era's default and sets `mapResetTriggered = true`. `MapArea` watches this flag and shows a toast for 2.5 s before clearing it.

Era detail logic: clicking an era node in `TimelineBar` sets `eraDetailOpen = true`. Selecting an entity automatically resets it to `false`. The close button in `DetailPanel` sets it back to `false` directly.

---

## Layout architecture

The application shell is defined in `App.tsx`:

```
App.tsx outer div: h-screen flex flex-col overflow-hidden
  ├── TopBar       (sticky top-0, h-12, z-50)
  ├── TimelineBar  (sticky top-12, z-40)
  └── Routes
       └── ExplorePage (flex flex-col flex-1 overflow-hidden)
            ├── Zone 3: flex flex-row flex-1
            │    ├── MapArea  (flex-1, Zone 3 left ~65%)
            │    └── Sidebar  (w-80, Zone 3 right ~35%)
            └── Zone 4: DetailPanel
```

**Key decision — sticky over fixed:** TopBar and TimelineBar use `sticky` positioning, not `fixed`. Fixed elements leave the normal document flow, requiring error-prone `padding-top` offsets that break whenever bar heights change. Sticky elements remain in the flow and push content down naturally. The `h-screen flex flex-col` shell ensures Zone 3 fills the remaining viewport without scrolling the outer container.

---

## Component responsibilities

| Component | Zone | Reads from context | Writes to context |
|-----------|------|--------------------|-------------------|
| `ErrorBoundary` | structural wrapper | — | — |
| `TopBar` | 1 | — | — |
| `TimelineBar` | 2 | `selectedEra` | `setEra`, `setEraDetailOpen` |
| `MapArea` | 3 left | `selectedMap`, `selectedEra`, `mapResetTriggered` | `setMap`, `clearMapResetTrigger` |
| `Sidebar` | 3 right | `selectedEra`, `filters`, `selectedEntityId` | `setFilter`, `setSelectedEntity` |
| `DetailPanel` | 4 | `selectedEntityId`, `eraDetailOpen`, `selectedEra` | `setSelectedEntity` (close entity), `setEraDetailOpen` (close era) |

`ErrorBoundary` is a root-level structural wrapper (`src/components/ErrorBoundary.tsx`) that catches unhandled render exceptions for the entire application tree. It reads no context — it sits outside `AppContext`. See `.claude/skills/logging-conventions.md` for usage rules.

---

## Data schemas

For entity field schemas, refer to `keynor-core/CLAUDE.md` — Domain entities section.

---

## Map types

- `navigable` — Leaflet.js `MapContainer` + `ImageOverlay`. Supports zoom and pan. Location pins (future task).
- `abstract` — full-bleed `<img>` or `bg-map-land` empty state. No interactive elements. Used for pre-material eras (e.g. Primordial Era).

---

## Pin visibility rules

Each place has `timeline.founded` and `timeline.destroyed`. A pin is rendered on the map only if the selected era falls within the place's active timeline window.

---

## Design tokens

All color tokens are defined in `src/index.css` via `@theme`. Use Tailwind utilities — never raw hex values in class names.

| Token | Value | Usage |
|-------|-------|-------|
| `bg-background` | `#f5f4f0` | Page background |
| `bg-surface` | `#ffffff` | Card and bar backgrounds |
| `text-foreground` | `#1a1a1a` | Primary text |
| `text-muted` | `#888888` | Secondary/placeholder text |
| `border-border` | `#e8e6e0` | Default borders |
| `bg-primary` | `#534AB7` | Active states, primary accent |
| `bg-primary-light` | `#EEEDFE` | Active card backgrounds |
| `border-primary-border` | `#AFA9EC` | Hover borders |
| `text-primary-foreground` | `#ffffff` | Text on primary backgrounds |
| `bg-map-land` | `#a8c8a0` | Map area background |
| `bg-map-water` | `#c8dfc4` | Leaflet map background |

**Do NOT use `text-muted-foreground`** — that is a shadcn/ui token not defined in this project. Use `text-muted`.

---

## Navigation

Five top-level routes:

| Route | View | Status |
|-------|------|--------|
| `/` or `/explore` | Atlas — map + timeline + sidebar + detail panel | Implemented |
| `/characters` | Characters list/detail | Placeholder |
| `/places` | Places list/detail | Placeholder |
| `/items` | Items list/detail | Placeholder |
| `/lore` | Lore list/detail | Placeholder |

---

## Agent operational rules

Before taking any action in this project — reading state, implementing features, creating branches, running commands, or opening PRs — every agent must:

1. Switch to `main`: `git checkout main`
2. Pull the latest changes: `git pull`

A second pull is not required within the same task session. See workspace `SKILLS.md` — Skill 09.

---

## Agent hierarchy

| Agent | Level | Scope |
|-------|-------|-------|
| `aniannoth` | 3 — Architect | Full project, all cross-cutting decisions |
| `gen-esir` | 2 — Developer | `src/` — React components, hooks, context, pages |
| `syde` | 2 — Test engineer | `tests/e2e/` — Playwright end-to-end tests |
| `aroneus` | 2 — Content author | Universe content authoring and submission to keynor-core API |
| `lethra` | 1 — Literary scribe | Produces descriptive prose for entity `body` and `summary` fields |

**Agent coordination:** Lethra produces prose → Aroneus structures it into keynor-core API payloads → user authorizes submission. Syde validates full flows end-to-end after Gen-Esir delivers features.

---

## Testing

### Unit and component tests — Vitest

- Files: `src/**/*.test.ts` and `src/**/*.test.tsx`
- Environment: jsdom
- Setup file: `src/test/setup.ts`
- Libraries: `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
- Run: `npx vitest run`

### End-to-end tests — Playwright

- Files: `tests/e2e/**/*.spec.ts`
- Browser: Chromium (local), full matrix on CI
- Config: `playwright.config.ts`
- Dev server started automatically before tests run
- Run: `npm run test:e2e`

### What each layer covers

| Layer | Examples |
|-------|---------|
| Vitest | Data hooks (`useEras`, `useMaps`, `useEntities`), AppContext state transitions |
| Playwright | Era change → toast + map reset, card click → detail panel, route navigation |

---

*Last updated: 2026-06-15*
