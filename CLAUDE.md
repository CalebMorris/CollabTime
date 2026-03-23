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

## MVP Scope

- Timezone detection from browser (user-overridable)
- Natural language / text timestamp import via chrono-node
- Manual time + timezone selection UI
- Discord timestamp export (click-to-copy formats like `<t:1543392060:f>`)
- Deep link export with preconfigured timestamp
