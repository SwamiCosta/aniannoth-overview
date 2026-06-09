# aniannoth-overview — Logging Conventions

> Project-level skill (Skill 06). Supplements workspace Skill 08 with stack-specific implementation details.
> Read this file whenever writing code that handles errors, processes async operations, or catches exceptions.

---

## The logger utility

**Location:** `src/lib/logger.ts`
**Export:** named export `logger`

```typescript
import { logger } from '@/lib/logger'
```

The logger is a thin wrapper over `console.*` with level filtering. It reads `VITE_LOG_LEVEL` at call time (not at module load), so changes to the env variable in a running dev server take effect without restarting.

### API

```typescript
logger.debug(message: string, ...args: unknown[]): void
logger.info(message: string, ...args: unknown[]): void
logger.warn(message: string, ...args: unknown[]): void
logger.error(message: string, ...args: unknown[]): void
```

The `...args` parameter accepts any additional values (Error objects, context objects, primitive values). All arguments are forwarded to the corresponding `console.*` method, so browsers render them fully in DevTools.

---

## VITE_LOG_LEVEL environment variable

| Variable | `VITE_LOG_LEVEL` |
|----------|-----------------|
| Default | `error` |
| Valid values | `debug`, `info`, `warn`, `error` |
| Where to set | `.env.local` for local development (not committed) |

The logger only emits a message if the message's level is **equal to or higher** than the configured level. Priority order (lowest to highest): `debug → info → warn → error`.

**Examples:**

```
VITE_LOG_LEVEL=debug   → all messages printed (development)
VITE_LOG_LEVEL=info    → info, warn, error printed
VITE_LOG_LEVEL=error   → only error printed (production default)
```

The default of `error` means that in production (where no env override is set), only `logger.error` calls produce output. `logger.debug`, `logger.info`, and `logger.warn` are silenced automatically.

---

## When to use each level

| Level | Use when |
|-------|----------|
| `error` | An async operation failed (API call, data fetch), an unhandled exception was caught, or the ErrorBoundary fires |
| `warn` | A recoverable unexpected state — e.g. missing optional data, a fallback was used instead of the expected value |
| `info` | Significant app-level events — reserved for future use (e.g. user authentication, meaningful navigation events) |
| `debug` | Internal flow tracing during development only — never ship `logger.debug` calls in production-facing logic |

**What to never log:**
- Tokens, API keys, or any value sourced from auth headers or secrets
- Full response bodies (may contain sensitive entity data)
- Complete stack traces at `info` or `warn` level — pass the raw `Error` object at `error` level only

---

## API error logging pattern

All functions in `src/api/` follow this pattern:

```typescript
export async function fetchXxx(...): Promise<...> {
  try {
    const data = await apiFetch<...>(url)
    return mapToLocalType(data)
  } catch (error) {
    logger.error(`Failed to fetch <entity> — <contextKey>: ${contextValue}`, error)
    throw error
  }
}
```

**Rules:**
- Always include the entity type and any available identifier in the message string (e.g. `category`, `id`, `eraId`).
- Always pass the raw `error` as the second argument — this surfaces the full stack trace in DevTools.
- Always rethrow after logging — the caller (hook or component) must still receive the rejection.
- Use `logger.error` only — API failures are ERROR-level events.

---

## ErrorBoundary

**Location:** `src/components/ErrorBoundary.tsx`
**Usage:** root-level wrapper in `src/main.tsx`

```tsx
<StrictMode>
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
</StrictMode>
```

`ErrorBoundary` is a React class component that catches any unhandled render error in the application tree. It:
- Calls `logger.error('Unhandled rendering error', error.message, info.componentStack)` in `componentDidCatch`
- Renders a full-screen fallback UI (`h-screen` centered message) when `hasError` is true

**Do not nest additional `ErrorBoundary` instances** unless a specific subtree requires isolated recovery behavior — that decision requires architect approval.

**Testing:** component tests live at `src/components/ErrorBoundary.test.tsx`. When testing components that trigger error boundaries, suppress `console.error` in `beforeEach` / restore in `afterEach` to keep test output clean.

---

*Last updated: 2026-06-09*
