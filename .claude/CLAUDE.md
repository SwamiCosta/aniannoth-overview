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
| Framework | React (TypeScript) |
| Build tool | Vite |
| State management | Context API — no Redux |
| Map rendering | Leaflet.js (react-leaflet) |
| Data source | Static JSON files in `content/` |

Routing, styling, and UI library decisions are pending — to be defined by the Aniannoth architect agent.

---

## Project structure

```
aniannoth-overview/
├── content/              ← static JSON data (source of truth in Phase 1)
│   ├── eras.json
│   ├── maps.json
│   ├── characters/
│   ├── places/
│   ├── factions/
│   ├── items/
│   ├── events/
│   └── lore/
├── src/                  ← React application (created after scaffold authorization)
├── .claude/
│   ├── CLAUDE.md         ← this file
│   └── agents/
│       └── aniannoth.md  ← Level 3 architect for this project
└── package.json          ← created after scaffold authorization
```

---

## Global state

```typescript
interface AppState {
  selectedEra: string;
  selectedMap: string;
  filters: FilterState;
}
```

Managed via Context API. On era change: if the current map does not exist in the new era, show a toast and redirect to the era's default map. Available maps in the selector are always filtered by the current era.

---

## Data schema

Each entity in `content/` follows this shape:

```typescript
interface Entity {
  id: string;
  name: string;
  category: string;
  tags: string[];
  image: string;
  summary: string;
  body: string;       // Markdown
  timeline: {
    founded?: string;
    destroyed?: string;
  };
  status: 'canon' | 'draft' | 'deprecated';
}
```

Eras and Maps have their own schemas — defined in `content/eras.json` and `content/maps.json`.

---

## Map types

- `navigable` — Leaflet.js map with clickable pins, zoom and pan
- `abstract` — static illustration, no navigation (used for pre-material eras)

---

## Pin visibility rules

Each place has `timeline.founded` and `timeline.destroyed`. A pin is visible on the map only if the selected era falls within the place's active timeline window.

---

## Agent hierarchy

| Agent | Level | Scope |
|-------|-------|-------|
| aniannoth | 3 — Architect | Full project, all cross-cutting decisions |

Additional Level 1 and Level 2 specialist agents may be created by Aniannoth as needed.

---

## Testing

- Component and logic tests: `*.test.tsx` / `*.test.ts`
- Test runner: to be defined by Aniannoth

---

*Last updated: 2026-05-31*
