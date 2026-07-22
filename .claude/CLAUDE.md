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

## Local environment assumptions

aniannoth-overview has no database and no persistent backend of its own. Vitest component/unit tests run standalone — no server required. Playwright e2e tests start their own dev server automatically as part of `npm run test:e2e` (managed by `playwright.config.ts`'s `webServer` option) — this is the test runner's own mechanism, not something an agent starts or stops manually.

**Dev server port is fixed at 4173 — never 5173.** `vite.config.ts` sets `server.port`/`preview.port` to `4173` with `strictPort: true`, so `npm run dev`, `npm run preview`, and Playwright's `webServer` all bind to the same port with no CLI flags needed. `strictPort` makes Vite fail loudly if 4173 is taken instead of silently falling back to a different port. Two reasons this exists:
- **keynor-rpg-client** is a separate Vite project that also defaults to port 5173 — whichever project starts first claims it, silently pushing the other to an unpredictable port.
- **keynor-core**'s CORS allowlist (`ResourceServerConfig.java`) only trusts `http://localhost:5173` and `http://localhost:4173` for this origin. Any other port gets browser-blocked on every `/api/public/v1/*` fetch — `curl` won't show this (CORS is enforced by the browser, not the server), so a real browser check is required to catch it.

If `npm run dev` ever fails with "Port 4173 is already in use," something else is squatting the canonical port (commonly a leftover dev server from a previous session) — find and close it rather than letting Vite fall back to another port.

If manual or exploratory testing requires real data (the app rendering against `/api/public/v1/`), that depends on **keynor-core** already running and reachable. Never start, stop, or restart keynor-core's database or application instance from this project — that belongs to keynor-core's own agents. If it is not reachable, stop and report instead of working around it.

See workspace `SKILLS.md` — Skill 13 for the general rule this follows.

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_LOG_LEVEL` | `error` | Controls the minimum log level emitted by `src/lib/logger.ts`. Valid values: `debug`, `info`, `warn`, `error`. Set to `debug` or `info` in `.env.local` for local development. Never committed. See `.claude/skills/logging-conventions.md`. |
| `VITE_ADMIN_CLIENT_ID` | `aniannoth-admin` | The OAuth2 `client_id` used for the map-pins inputter login flow (`AuthContext.tsx`, `authorization_code` + PKCE against keynor-core). **Not usable until this client is actually registered** in keynor-core's `oauth2_registered_client` table as a public (no-secret) PKCE client with this `client_id`, `redirect_uri` matching `<origin>/auth/callback`, and `authorization_grant_types` including `authorization_code` — keynor-core's bootstrap procedure (`.claude/skills/security-model.md`) only documents registering the `system-client` (client_credentials); this ADMIN client still needs to be registered the same way, by the user. |

---

## Project structure

```
aniannoth-overview/
├── src/
│   ├── components/
│   │   ├── TopBar.tsx        ← global navigation bar (Zone 1)
│   │   ├── TimelineBar.tsx   ← era selector track + temporal point pins (Zone 2)
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
│   ├── universe-glossary.md  ← shared universe terminology (read by Lethra; also read by Aroneus in keynor-core)
│   └── agents/
│       ├── aniannoth.md      ← Level 3 architect for this project
│       ├── gen-esir.md       ← Level 2 React/TypeScript developer (owns src/)
│       ├── syde.md           ← Level 2 Playwright test engineer (owns tests/e2e/)
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
  eraDetailOpen: boolean               // true when DetailPanel is showing a timeline entry (era or point)
  setEraDetailOpen: (open: boolean) => void
  timelineDetailId: string | null      // id of the era/point currently shown in DetailPanel
  openTimelineDetail: (entryId: string) => void  // sets timelineDetailId and opens the panel
}
```

Era change logic: if the current map does not exist in the new era, `setEra` resets `selectedMap` to the first map available in that era (`maps.find(m => m.availableInEras.includes(eraId))`) and sets `mapResetTriggered = true`. `MapArea` watches this flag and shows a toast for 2.5 s before clearing it. `Era` has no map-related field of its own — `GameMap.availableInEras` is the only source of the era↔map association.

Timeline detail logic: `timelineDetailId` is decoupled from `selectedEra` — it tracks which entry's description is shown in `DetailPanel`, independent of which era currently drives the map. Clicking an era node in `TimelineBar` calls both `setEra(era.id)` (drives the map) and `openTimelineDetail(era.id)` (drives the panel). Clicking a temporal point calls only `openTimelineDetail(point.id)` — the map and `selectedEra` are left untouched. Selecting an entity automatically sets `eraDetailOpen` back to `false`. The close button in `DetailPanel` sets it back to `false` directly.

Temporal points: the `/api/public/v1/eras` endpoint returns both ERA entries and POINT entries (type: `'ERA' | 'POINT'`, importance: `'STANDARD' | 'MAJOR' | null`). Both ERA and POINT entries are selectable buttons in the timeline. ERA entries also drive the map (`setEra`); POINT entries only open their own description in `DetailPanel` via `openTimelineDetail` — they never affect `selectedEra` or the map. STANDARD points render as a small circle, MAJOR points as a larger diamond using `bg-primary`; the currently open point is highlighted with the primary color. All timeline markers (era circle, point dot, point diamond) sit inside a fixed 24px slot so they stay centered on the connecting line regardless of glyph size.

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

**Key decision — DetailPanel has a fixed height, Sidebar scrolls internally:** `DetailPanel` (Zone 4) uses a fixed `h-72 shrink-0`, never `min-h-*`. A min-height only sets a floor — the panel still grows with its own content, and in a column flex layout that growth steals space from sibling flex items rather than respecting the viewport. With a fixed height, the reading area never changes size; any overflowing content (the markdown body, the timeline summary) scrolls inside its own `overflow-y-auto` region instead. Every flex container between the `h-screen` shell and `Sidebar`'s scrollable list (`ExplorePage`'s Zone 3 row, and the `w-80` Sidebar wrapper div) must carry `min-h-0`. Without it, flex items default to an automatic minimum height based on content size, so a long entity list silently expands the whole row instead of triggering `Sidebar`'s own `overflow-y-auto`. Any new flex container inserted between the shell and a scrollable descendant must continue this `min-h-0` chain.

**Fullscreen overlays:** `z-[100]` is reserved for full-viewport overlays (e.g. `DetailPanel`'s expanded reading view and image lightbox) — chosen to sit above TopBar (`z-50`) and TimelineBar (`z-40`). These overlays use `fixed inset-0` and render as a sibling alongside the underlying panel, which stays mounted (not unmounted) behind them.

**Key decision — per-entity local state needs a `key`:** `DetailPanel` never unmounts when the selected entity changes from one known entity to another (Sidebar click, Related Entities click) — only `ctx.selectedEntityId` changes and the same component tree re-renders with new props. Any component holding local `useState` that's only meaningful for the *current* entity (e.g. `ImageGallery`'s `activeIndex` and `isLightboxOpen`) must be given `key={entity.id}` where it's rendered, or its state silently carries over to the next entity (visible bug: an image index from a previous entity outliving the entity it belonged to, indexing past the new entity's `images` array). `isBodyExpanded`, by contrast, intentionally lives in `DetailPanel` itself (not keyed) so the expanded reading view survives navigating to a different entity via Related Entities — it resets only when the panel is closed (`selectedEntityId` becomes `null`).

**Key decision — expanded reading view puts the image beside the text, not above it:** the expanded view (`isBodyExpanded`) lays out `ReactMarkdown` and `RelatedEntities` in a `flex-1` left column and, when the entity has images, a fixed `w-72 h-80` `ImageGallery` column to the right, both inside a `max-w-5xl mx-auto` row. An earlier version stacked the gallery above the text in a short wide box (`h-64` at `max-w-3xl` width) — `object-cover` on that aspect ratio heavily cropped portrait artwork. The side column gives the gallery a closer-to-portrait box, and `sticky top-0 self-start` keeps it in view while the text column scrolls past it.

---

## Component responsibilities

| Component | Zone | Reads from context | Writes to context |
|-----------|------|--------------------|-------------------|
| `ErrorBoundary` | structural wrapper | — | — |
| `TopBar` | 1 | — | — |
| `TimelineBar` | 2 | `selectedEra`, `eraDetailOpen`, `timelineDetailId` | `setEra`, `openTimelineDetail` |
| `MapArea` | 3 left | `selectedMap`, `selectedEra`, `mapResetTriggered` | `setMap`, `clearMapResetTrigger` |
| `Sidebar` | 3 right | `selectedEra`, `filters`, `selectedEntityId` | `setFilter`, `setSelectedEntity` |
| `DetailPanel` | 4 | `selectedEntityId`, `eraDetailOpen`, `timelineDetailId` | `setSelectedEntity` (close entity), `setEraDetailOpen` (close timeline detail) |

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

Before beginning the task itself — reading project source or task-specific documentation, implementing features, creating branches, running commands, or opening PRs — every agent must:

1. Switch to `main`: `git checkout main`
2. Pull the latest changes: `git pull`

This does not apply to the agent's own fixed mandatory reading (`ARCHITECTURE.md`, the root `CLAUDE.md`, `SKILLS.md`, this file, the agent's own `.md` file, and any Always-tier skill file) — reading those is how an agent learns this very rule, not an action on the project's current state. Sync once the agent moves on to the task itself.

A second pull is not required within the same task session. See workspace `SKILLS.md` — Skill 09.

---

## Agent hierarchy

| Agent | Level | Scope |
|-------|-------|-------|
| `aniannoth` | 3 — Architect | Full project, all cross-cutting decisions |
| `gen-esir` | 2 — Developer | `src/` — React components, hooks, context, pages |
| `syde` | 2 — Test engineer | `tests/e2e/` — Playwright end-to-end tests |
| `lethra` | 1 — Literary scribe | Produces descriptive prose for entity `body` and `summary` fields |

**Agent coordination:** Lethra produces prose → Aroneus (keynor-core) structures it into API payloads → user authorizes submission. Syde validates full flows end-to-end after Gen-Esir delivers features.

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

*Last updated: 2026-06-28*
