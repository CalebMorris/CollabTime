# CollabTime

Timezone coordination tool. Users pick a time in their timezone; others see it in theirs.

## Stack

- React 19, TypeScript, Tailwind CSS 4
- Vite (dev server + build)
- Vitest + Testing Library (tests)
- chrono-node (natural language date parsing)

### chrono-node timezone behaviour

chrono-node maps `EST`/`CST`/`MST`/`PST` to **fixed offsets** (e.g. EST = UTC-5 always). It separately provides DST-aware region codes: `ET`, `CT`, `MT`, `PT`. To handle the common case where users write "EST" year-round meaning "Eastern time", `parseTime` normalises the four standard abbreviations to their region counterparts before parsing (`src/utils/parseTime.ts`). The region codes honour US DST transitions automatically.

## Commands

```
npm run dev       # start dev server
npm run build     # type-check + build
npm run test      # run tests (watch mode)
npm run lint      # eslint
npm run coverage  # test coverage
```

## Conventions

- Use `jq` instead of Python for parsing JSON in shell scripts or commands
- Use descriptive variable names that convey context; avoid short single-word names (e.g. prefer `selectedTimezone` over `tz`, `parsedTimestamp` over `ts`)

## Testing

Use red-green TDD. Write a failing test first, then implement. Tests live alongside source files (`*.test.ts` / `*.test.tsx`).

### Timezone parsing tests

For any test involving a timezone abbreviation in natural language input, always cover:
1. **During DST** (e.g. ref date in March) — US standard abbreviations like `EST` are colloquially used year-round
2. **During standard time** (e.g. ref date in January) — verify the offset is still correct when DST is not active
3. **Round-trip assertion** — parse `"8PM EST"` and confirm the timestamp displays back as `8PM` in the relevant IANA timezone (not just check UTC). This catches off-by-one-hour bugs that pass UTC checks but produce wrong local times.

## Accessibility

Keep accessibility up to date alongside any UI/UX change:
- Update ARIA roles, labels, and attributes when markup changes
- Ensure keyboard navigation and focus order remain correct
- Add or update `a11y.test.tsx` coverage for new/changed interactive elements
- For motion effects (confetti, animations): **omit the element entirely** when `prefers-reduced-motion: reduce` — do not just hide it

## Party System

### Architecture

Three layers — no router, no global state library:

- **Layer 1** `src/room/` — pure TS WebSocket transport + protocol types (no React)
- **Layer 2** `src/hooks/` — `useRoom` (WS state machine), `usePartyMode` (view routing)
- **Layer 3** `src/components/party/` — all party UI components

`AppMode` discriminated union in `App.tsx` drives view switching between solo and party screens. `useDeepLink` is **gated to solo mode only** (`appMode.kind === 'solo'`) — party mode manages its own URL state via `usePartyMode`.

### State persistence

`sessionStorage` keys are namespaced by `roomCode` to prevent stale-token collisions across rooms.

### Product/UX decisions

| Decision | Rule |
|---|---|
| Proposals board timezones | Viewer's own timezone only — **no TZ labels** on any row |
| Dead room errors | Generic "Room not found" for all `ROOM_NOT_FOUND` errors — no oracle leakage |
| Post lock-in export | **Nicknames only** — no timezone info shown |
| Nickname re-roll | **Dropped from MVP** — auto-generated nickname is fixed for the session |
| Lock-in modal | Auto-dismisses after 2500ms; tappable/clickable to skip early |

### Testing: WebSocket hooks

- `useRoom` accepts an injectable `socketFactory?: () => RoomSocket` parameter — avoids patching `globalThis.WebSocket`
- In tests, pass a `FakeRoomSocket` with a `simulateMessage(msg)` helper
- Use `vi.useFakeTimers()` for reconnect-countdown and auto-dismiss timing tests

## MVP Scope

- Timezone detection from browser (user-overridable)
- Natural language / text timestamp import via chrono-node
- Manual time + timezone selection UI
- Discord timestamp export (click-to-copy formats like `<t:1543392060:f>`)
- Deep link export with preconfigured timestamp
