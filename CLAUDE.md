# CollabTime

Timezone coordination tool. Users pick a time in their timezone; others see it in theirs.

## Stack

- React 19, TypeScript, Tailwind CSS 4
- Vite (dev server + build)
- Vitest + Testing Library (tests)
- chrono-node (natural language date parsing)

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
