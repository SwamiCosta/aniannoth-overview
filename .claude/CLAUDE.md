# aniannoth-overview — Agent Context

> Project-level context for AI agents operating in aniannoth-overview.
> Always read ARCHITECTURE.md at the workspace root before reading this file.

---

## What this project is

A React + TypeScript web application for exploring the Keynor universe. Acts as an interactive atlas — no dedicated backend in Phase 1, consuming static JSON files from the `content/` directory.

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
| Data source | Static JSON files in `content/` |

**shadcn/ui note:** the CLI (`npx shadcn init`) has a known bug with Tailwind v4 as of May 2026. Setup was done manually. To add components, use `npx shadcn@latest add [component]` — the `add` command works correctly.

---

## Project structure

```
aniannoth-overview/
├── content/                  ← static JSON data (source of truth in Phase 1)
│   ├── eras.json
│   ├── maps.json
│   ├── characters/
│   ├── places/
│   ├── factions/
│   ├── items/
│   ├── events/
│   └── lore/
├── src/
│   ├── components/
│   │   └── ui/               ← shadcn/ui components (added via CLI as needed)
│   ├── hooks/                ← custom React hooks
│   ├── lib/
│   │   └── utils.ts          ← cn() utility (clsx + tailwind-merge)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css             ← Tailwind import + project CSS variables
├── references/               ← wireframe and design guidelines
│   ├── atlas-wireframe.html
│   └── atlas-wireframe.md
├── .claude/
│   ├── CLAUDE.md             ← this file
│   └── agents/
│       └── aniannoth.md      ← Level 3 architect for this project
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
  filters: {
    category: string | null;  // 'characters' | 'places' | 'items' | 'events' | null
    tags: string[];
  };
}
```

Managed via Context API. On era change: if the current map does not exist in the new era, show a toast and redirect to the era's default map. Available maps in the selector are always filtered by the current era.

---

## Data schemas

### Entity (characters, places, factions, items, events, lore)

Each entity lives in its own JSON file under its category folder.

```typescript
interface Entity {
  id: string;
  name: string;
  category: string;
  tags: string[];
  image: string;
  summary: string;       // short text for sidebar cards
  body: string;          // Markdown — rendered in detail panel
  location: string;      // place id (empty string if not applicable)
  timeline: {
    era: string;         // era id
    born?: number;       // for characters
    died?: number;       // for characters
    founded?: number;    // for places
    destroyed?: number;  // for places
  };
  status: 'canon' | 'draft' | 'deprecated';
}
```

### eras.json

```typescript
interface Era {
  id: string;
  name: string;
  order: number;
  period: string;        // e.g. "Anno 1 – 300"
  summary: string;
  mapType: 'navigable' | 'abstract';
  defaultMap: string;    // map id
  color: string;         // hex color for UI accent
}
```

### maps.json

```typescript
interface GameMap {
  id: string;
  name: string;
  type: 'navigable' | 'abstract';
  image: string;         // path to map image
  availableInEras: string[];  // era ids — many-to-many
}
```

---

## Map types

- `navigable` — Leaflet.js map with clickable pins, zoom and pan
- `abstract` — static illustration, no navigation (used for pre-material eras)

---

## Pin visibility rules

Each place has `timeline.founded` and `timeline.destroyed`. A pin is rendered on the map only if the selected era falls within the place's active timeline window.

---

## Navigation

Five top-level routes defined in the wireframe:

| Route | View |
|-------|------|
| `/` or `/explore` | Atlas — map + timeline + sidebar + detail panel |
| `/characters` | Characters list/detail |
| `/places` | Places list/detail |
| `/items` | Items list/detail |
| `/lore` | Lore list/detail |

---

## Agent hierarchy

| Agent | Level | Scope |
|-------|-------|-------|
| aniannoth | 3 — Architect | Full project, all cross-cutting decisions |

Additional Level 1 and Level 2 specialist agents may be created by Aniannoth as needed.

---

## Testing

- Component and logic tests: `*.test.tsx` / `*.test.ts`
- Test runner: to be defined by Aniannoth before the first test is written

---

*Last updated: 2026-05-31*
