# aniannoth-overview — UI Wireframe Reference

> This document describes the interface structure, layout decisions, component behaviors,
> and navigation logic defined during the planning phase.
> Use this as the product reference during frontend development.

---

## Overall layout

The interface is a single-page application with four distinct vertical zones:

```
┌─────────────────────────────────────────────────────┐
│ 1. Top bar (global navigation)                      │
├─────────────────────────────────────────────────────┤
│ 2. Timeline bar (era selector)                      │
├───────────────────────────────────┬─────────────────┤
│                                   │                 │
│ 3. Map area                       │ 3. Sidebar      │
│                                   │                 │
├───────────────────────────────────┴─────────────────┤
│ 4. Detail panel                                     │
└─────────────────────────────────────────────────────┘
```

---

## Zone 1 — Top bar

A fixed horizontal bar at the top of the page.

**Left side:** logo/brand — icon + "Atlas" text.

**Right side:** global navigation links:
- Explore (default active)
- Characters
- Places
- Items
- Lore

The active link has a distinct visual treatment (highlighted background, accent color).

---

## Zone 2 — Timeline bar

A horizontal bar immediately below the top bar. Always visible.

**Label:** small uppercase muted text reading "timeline" above the track.

**Track:** a horizontal line with era nodes spaced evenly across the full width.

### Era node states
- **Default:** small circle, neutral border, muted label below
- **Active:** filled circle in accent color, label in accent color and medium weight
- **Abstract era** (pre-material world): dashed border circle, visually distinct from navigable eras

### Behavior
- Clicking an era node sets it as the selected era
- The entire interface refilters based on the selected era
- If the currently selected map does not exist in the new era, a toast notification appears and the map resets to the era's default map

---

## Zone 3 — Map area (left) + Sidebar (right)

These two panels sit side by side and share the same vertical space.

### Map area

Occupies approximately 60–65% of the horizontal space.

**Top-left overlay:** a badge showing the name of the currently selected map, with a map pin icon.

**Top-right overlay:** a map selector control — shows current map name with a dropdown chevron. Only maps available in the current era appear as options.

**Map types:**

`navigable` — rendered with Leaflet.js using a custom image as the tile layer.
- Supports zoom and pan
- Location pins are rendered as clickable markers
- Clicking a pin sets it as active and filters the sidebar content

`abstract` — a full-bleed illustration image with no interactive elements.
- No pins, no zoom, no pan
- Content appears in the sidebar without location filtering

**Pin states:**
- Default: small filled circle, neutral color, label below
- Active: larger filled circle, accent color, label below

**Pin visibility:** each place has `timeline.founded` and `timeline.destroyed` fields. Pins are only rendered if the place exists during the selected era.

**Toast notification:** appears at the bottom center of the map area when the selected map is unavailable in a newly selected era. Message example: "Map unavailable for this era. Redirecting to default." Disappears automatically after ~2.5 seconds.

### Sidebar

Occupies approximately 35–40% of the horizontal space. Fixed height, scrollable content list.

**Header:**
- Title: name of the active pin or selected map (with a pin icon)
- Subtitle: era name + map/region name

**Filter chips:** a row of pill-shaped filter buttons below the header.
- Options: All, Characters, Events, Items (expandable in the future)
- One active at a time
- Filters the content list below

**Content list:** a scrollable list of cards, each showing:
- Type label (e.g. "Character", "Event", "Item") in accent color, small uppercase
- Entity name in medium weight
- Short description or date in muted small text

Clicking a card opens the detail panel (Zone 4) for that entity.

---

## Zone 4 — Detail panel

A horizontal panel at the bottom of the page. Appears when an entity card is selected in the sidebar.

**Left column:** image placeholder (square, rounded corners). Displays a fallback icon when no image is available.

**Right column:**
- Entity title (large, medium weight)
- Metadata row: category · location · era (small, muted, dot-separated)
- Tag pills: `canon`, `draft`, `deprecated`, plus any custom tags
- Body text: Markdown-rendered descriptive content (truncated with expand option in future iterations)

---

## Global state

```typescript
{
  selectedEra: string,       // era id
  selectedMap: string,       // map id
  filters: {
    category: string | null, // "characters" | "places" | "items" | "events" | null
    tags: string[]
  }
}
```

Managed via React Context API. No external state library in phase 1.

---

## Era change logic

```
User selects a new era
  └── Does the current map exist in this era?
        ├── Yes → keep current map, refilter all content by new era
        └── No  → show toast notification
                  reset map to the era's default map
                  refilter all content by new era + default map
```

---

## Map selector logic

The map selector dropdown only shows maps that are available in the currently selected era. This prevents the user from actively selecting an invalid era+map combination. The redirect logic only triggers when the era changes while an incompatible map is already selected.

---

## Content filtering logic

When a pin is selected on the map, the sidebar shows only content associated with that location AND the selected era.

When no pin is selected (abstract map or no active pin), the sidebar shows all content for the selected era.

Filter chips further narrow the list by entity category.

---

## Data structure reference

All content is stored as static JSON files under `content/`.

### eras.json
```json
[
  {
    "id": "era-id",
    "name": "Era Name",
    "order": 1,
    "period": "Anno 1 – 300",
    "summary": "Short description",
    "mapType": "navigable",
    "defaultMap": "map-id",
    "color": "#hex"
  }
]
```

### maps.json
```json
[
  {
    "id": "map-id",
    "name": "Map Name",
    "type": "navigable",
    "image": "path/to/map-image.jpg",
    "availableInEras": ["era-id-1", "era-id-2"]
  }
]
```

### Entity file (e.g. characters/character-name.json)
```json
{
  "id": "unique-id",
  "name": "Entity Name",
  "category": "character",
  "tags": ["tag1", "tag2"],
  "image": "path/to/image.jpg",
  "summary": "Short description for cards",
  "body": "Full Markdown content for detail panel",
  "location": "place-id",
  "timeline": {
    "era": "era-id",
    "born": 401,
    "died": 589
  },
  "status": "canon"
}
```

---

## Design notes

- Color palette centers on a purple accent ramp for interactive/active states
- Map background uses soft greens to evoke a classic fantasy cartography feel
- Typography: system sans-serif, two weights only (400 regular, 500 medium)
- No gradients, no drop shadows — flat surfaces throughout
- Mobile responsiveness: to be defined in a future iteration

---

*Last updated: 2026-05-31*
