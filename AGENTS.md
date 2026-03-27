# AGENTS.md

Instructions for agentic coding agents operating in this repository.

## Build / Lint / Test Commands

```bash
# Development
npm run dev           # Start Vite dev server (http://localhost:5173/CollabTime/)

# Build
npm run build         # TypeScript type-check + Vite production build

# Linting
npm run lint          # ESLint on all files

# Testing (unit tests)
npm run test          # Vitest in watch mode
npm test src/utils/foo.test.ts          # Run single test file
npm test -- --run src/utils/foo.test.ts # Run once (CI mode)
npm test -- --run src/utils/           # Run all tests in a directory

# Test coverage
npm run coverage      # vitest run --coverage (HTML + LCOV reports)

# E2E testing (requires dev server running)
BASE_URL=http://localhost:5173/CollabTime/ npm run test:e2e
BASE_URL=http://localhost:5173/CollabTime/ npm run test:e2e -- e2e/solo-mode.spec.ts
BASE_URL=http://localhost:5173/CollabTime/ npm run test:e2e:ui  # Playwright UI debugger
```

**Important:** Run `npm run build` before committing to catch type errors.

---

## Stack

- React 19, TypeScript (strict mode), Tailwind CSS 4
- Vite, Vitest + Testing Library, Playwright (e2e)
- chrono-node (natural language date parsing)
- No router; no global state library

---

## TypeScript

- **Strict mode enabled** (`tsconfig.app.json`): `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`
- Use explicit types for exported functions; internal helpers can use type inference
- Avoid `any` — use `unknown` and narrow appropriately
- Prefer `Record<string, T>` over plain object types with optional keys
- Server may send `undefined` for optional fields; use loose `!= null` checks, not `!== null`

---

## Imports

```typescript
// Relative imports
import { foo } from './foo'
import { foo } from '../utils/foo'
import type { Foo } from '../room/roomProtocol'  // Use `import type` for types only

// Absolute-style imports (via Vite alias)
import { useRoom } from '../hooks/useRoom'
```

- Group imports: React hooks first, then external libs, then internal modules
- Use `import type` for type-only imports (enables tree-shaking)
- Prefer named exports over default exports (easier refactoring)

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Variables / functions | camelCase | `selectedTimezone`, `parseTime` |
| React components | PascalCase | `ProposalsBoard`, `TimezoneSelect` |
| Types / interfaces | PascalCase | `ParseResult`, `Participant` |
| Constants | SCREAMING_SNAKE_CASE | `INITIAL_STATE`, `TERMINAL_ERRORS` |
| CSS classes | Tailwind utility classes | `text-sm`, `flex items-center gap-2` |

- Use **descriptive names** — prefer `selectedTimezone` over `tz`, `parsedTimestamp` over `ts`
- Avoid abbreviated names for library/API objects: use `roomSocket` or `socket`, not `ws`
- Prefer full words: `participants`, not `parts`

---

## React Component Patterns

- Function components only; no class components
- Destructure props at the signature: `function Foo({ a, b }: FooProps)`
- Keep components focused — extract logic to custom hooks
- Use `useCallback` for functions passed as props that are stable across renders
- Use `useRef` for values that change without causing re-renders
- Avoid inline arrow functions in JSX for event handlers that could cause child re-renders

---

## State Management

- Local `useState` for component-local state
- Custom hooks (`src/hooks/`) for shared stateful logic
- `sessionStorage` keys namespaced by `roomCode` to prevent collisions across rooms
- No global state library (Zustand, Redux, etc.)

---

## Error Handling

- Use discriminated unions for result types: `{ ok: true; value: T } | { ok: false; error: string }`
- Never swallow errors silently — log and handle or re-throw
- Never expose server-side error details to the client (e.g., "Room not found" for all `ROOM_NOT_FOUND` errors)

---

## Testing

### Unit Tests (Vitest)

- Tests live **alongside source files**: `src/utils/parseTime.ts` → `src/utils/parseTime.test.ts`
- Use **red-green TDD**: write a failing test, then implement
- Structure: `describe` blocks group related tests, `it` describes the expected behavior
- Prefer `expect(...).toEqual()` for exact matches; use matchers like `toContain`, `toBeTruthy`, `toBeNull` for partial checks

```typescript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('parseTime — Unix timestamps', () => {
  it('parses Unix seconds', () => {
    const result = parseTime('1543392060')
    expect(result).toEqual({ ok: true, timestamp: 1543392060 * 1000 })
  })
})
```

### Timezone Parsing Tests

Always cover:
1. **During DST** (ref date in March)
2. **During standard time** (ref date in January)
3. **Round-trip assertion** — parse `"8PM EST"`, confirm it displays back as 8PM in the relevant IANA timezone (not just check UTC)

### FakeRoomSocket Pattern

For testing hooks that use WebSockets (e.g., `useRoom`), inject a fake:

```typescript
class FakeRoomSocket {
  constructor(private cb: RoomSocketCallbacks) {}
  connect(url: string) { /* ... */ }
  send(msg: object) { /* ... */ }
  disconnect() { /* ... */ }
  simulateMessage(msg: ServerMessage) { this.cb.onMessage(msg) }
  simulateOpen() { this.cb.onOpen() }
  simulateClose() { this.cb.onClose(new CloseEvent('close')) }
}
```

Pass via the `socketFactory` parameter: `renderHook(() => useRoom(ROOM_CODE, factory))`

### Fake Timers

Use `vi.useFakeTimers()` for reconnect countdown and auto-dismiss timing tests. **Do not** use in e2e tests or alongside `axe()` (causes cascading failures).

### E2E Tests (Playwright)

Tests live in `e2e/`. Three files:

| File | Scope |
|---|---|
| `e2e/solo-mode.spec.ts` | Page load, text import, manual selector, timezone picker, export panel, deep links |
| `e2e/party-overlays.spec.ts` | Create/join overlays — modal behaviour, validation, clipboard, focus trap |
| `e2e/party-ws.spec.ts` | Party room flows — uses `page.routeWebSocket()` to mock the server |

**Prerequisites:** `npx playwright install` (one-time), dev server running (`npm run dev`)

**Clipboard tests** work in Chromium but are a no-op in WebKit/Firefox. Most reliable on `chromium` project.

**Party-room WS tests** intercept via `page.routeWebSocket(/.*/)`. Key API:
- `wsRoute.onMessage(handler)` — receive messages sent by the page
- `wsRoute.send(jsonString)` — push server message to page
- `wsRoute.close()` — simulate server-side disconnect

**React StrictMode double-invoke:** Effects run twice in dev, creating two WS connections. Always call `serverWs$()` getter **after** `waitForRoomConnected` to get the live connection. The `mockServer()` helper tracks `latestWs` to handle this.

**Reconnect tests:** Set `shouldRespond = false` before closing so the reconnect WS hangs, keeping the banner visible for assertions.

**Do not** add `vi.useFakeTimers()` to e2e tests — Playwright manages real browser time. Use `page.waitForTimeout()` sparingly (prefer `expect(...).toBeVisible({ timeout: N })`).

### Accessibility Tests (`a11y.test.tsx`)

- Update coverage when markup changes
- `aria-live` belongs on non-interactive elements (`<span>`, `<div>`), not `<button>`
- Modal dialogs require: (1) focus moved in on open, (2) Tab cycles within (focus trap), (3) Escape closes
- `LockInModal` uses `role="alertdialog"` — use `getByRole('alertdialog')` in tests
- `TimezoneSelect` uses `role="combobox"` — use `getByRole('combobox', { name: /search timezones/i })` in tests
- **Never use `vi.useFakeTimers()` alongside `axe()`** — fake timers block axe's async machinery, causing cascading failures in subsequent tests. Test timing behavior in separate non-axe tests.
- Omit animated elements for `prefers-reduced-motion: reduce` — do not just hide them
- `role="progressbar"` requires an accessible name (`aria-label`, `aria-labelledby`, or `title`)
- Tailwind's `animate-pulse` is not guarded by `prefers-reduced-motion` — use `motion-safe:animate-pulse`

---

## Tailwind CSS

- Utility-first — use inline classes on elements
- Use `@apply` sparingly (prefer direct utility classes)
- Dark theme: `bg-gray-950`, `text-gray-100`, `border-gray-800`
- Hover states: `hover:text-gray-100 hover:border-gray-600`
- Consistent spacing: `gap-2`, `gap-4`, `gap-6` for small/medium/large gaps

---

## Shell / CLI

- Use `jq` instead of Python for parsing JSON in shell scripts or commands

## Git Conventions

- Commit message style: concise summary line (under 72 chars), blank line, optional body
- Never commit secrets, API keys, or credentials
- Never `git push --force` to main/master
- Prefer `git commit --amend` only for hook-auto-fixed files; otherwise create a new commit

---

## chrono-node Timezone Behavior

chrono-node treats `EST`/`CST`/`MST`/`PST` as **fixed offsets** (EST = UTC-5 always). Users colloquially write "EST" year-round meaning "Eastern time".

The codebase normalizes these abbreviations to DST-aware region codes (`ET`, `CT`, `MT`, `PT`) in `parseTime()` before passing to chrono-node. The region codes honor US DST transitions automatically.

---

## Party System Architecture

Three layers — no router:

1. **`src/room/`** — pure TypeScript WebSocket transport + protocol types (no React)
2. **`src/hooks/`** — `useRoom` (WS state machine), `usePartyMode` (view routing)
3. **`src/components/party/`** — all party UI components

`AppMode` discriminated union in `App.tsx` drives view switching. `useDeepLink` is **gated to solo mode only**.

### URL Parameters

| Parameter | Format | Effect |
|---|---|---|
| `?code=<roomCode>` | `adjective-noun-noun` | Pre-fills join overlay (read-only); user taps [Join Party] to connect |
| `?locked-in=<roomCode>&time=<epochMs>` | room code + Unix ms | Opens export screen directly with confirmed time |

### Server Protocol Notes

- `join` **always creates** a new room if the code doesn't exist — `ROOM_NOT_FOUND` only fires for locked/expired rooms or failed rejoin
- `room_activated` carries a full participant snapshot — update the full participants array, not just `roomPhase`
- Server may send `undefined` for optional fields — use loose `!= null` checks

### Product/UX Decisions

| Decision | Rule |
|---|---|
| Proposals board timezones | Viewer's own timezone only — **no TZ labels** on any row |
| Dead room errors | Generic "Room not found" for all `ROOM_NOT_FOUND` errors |
| Post lock-in export | **Nicknames only** — no timezone info shown |
| Lock-in modal | Auto-dismisses after 2500ms; tappable/clickable to skip early |
