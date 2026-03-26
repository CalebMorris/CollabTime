# UI/UX Review — CollabTime

Reviewed via static source analysis of all TSX components and CSS. App uses Tailwind CSS 4, `gray-950` dark theme, indigo/emerald accents.

Review date: 2026-03-23

---

## Issues

### High

| Code | Issue | Location |
|---|---|---|
| UI-001 | No Escape key handler on modal overlays — dismissal is backdrop-click only | `PartyCreateOverlay.tsx`, `PartyJoinOverlay.tsx` |
| UI-002 | "Join Party" button has no inline validation error message — only feedback when typing an invalid code is the button staying dim | `PartyJoinOverlay.tsx` |

---

### Medium

| Code | Issue | Location |
|---|---|---|
| UI-003 | Parse button missing `min-h-[44px]` touch target — uses `py-1` vs `py-2` on all other buttons; too small for comfortable mobile tap | `TextImport.tsx` |
| UI-004 | TextImport textarea has no visible border in the unfocused state — blends into the card background; every other input uses `border border-gray-700` | `TextImport.tsx` |
| UI-005 | ConnectionStatus shows plain centered text during `connecting`/`joining` phases with no spinner or progress indicator — may look hung | `PartyRoom.tsx` |
| UI-006 | Export section heading uses `text-gray-500` while every other section heading uses `text-gray-400` — inconsistently dimmer with no semantic reason | `App.tsx:179` |
| UI-007 | `animate-pulse` on ConsensusMeter fill bar is a Tailwind utility class and is not guarded by `prefers-reduced-motion` — affects users with vestibular disorders | `ConsensusMeter.tsx` |
| UI-008 | Dead room "Try a Different Code" requires an extra tap before the input appears — user is already frustrated; auto-showing the input (or auto-focusing on load) would reduce friction | `PartyDeadRoom.tsx` |
| UI-009 | LockInModal has no confetti or celebratory particle effect — the plan called for confetti (omitted for `prefers-reduced-motion`); the current 🎉 emoji + heading is functional but the lock-in moment could feel more rewarding | `LockInModal.tsx` |
| UI-010 | ProposalsBoard aside has no `max-height` cap on mobile — with many participants the proposals list can push the time picker far down with no obvious scroll affordance | `PartyRoom.tsx` |

---

### Low

| Code | Issue | Location |
|---|---|---|
| UI-011 | `▸`/`▾` Unicode triangle characters used as expand/collapse icons — renders inconsistently across browsers and OSes at small sizes; Lucide `ChevronDown`/`ChevronUp` would be sharper | `App.tsx`, `DiscordExport.tsx` |
| UI-012 | LockInModal "Tap anywhere to continue" hint is `text-gray-600` — approximately 2.3:1 contrast ratio on `gray-950/95` background, below WCAG AA (4.5:1); should be at least `text-gray-400` | `LockInModal.tsx` |
| UI-013 | RoomCodePill has no copy-on-click affordance — users inside the room who want to re-share the code have no quick way to copy it from the header | `RoomCodePill.tsx` |
| UI-014 | Attempted code text in dead room screen is `text-gray-500` — very dim for a value the user will want to read and correct | `PartyDeadRoom.tsx` |
| UI-015 | PartyExportScreen header shows only "Locked In!" with no back/navigation affordance — the "Back to Solo Mode" CTA is at the bottom of a long scrollable page | `PartyExportScreen.tsx` |
| UI-016 | ManualSelector `<input type="datetime-local">` has no `w-full` class — may clip on small screens | `ManualSelector.tsx` |
| UI-017 | "Result" section heading always visible even when `timestamp` is null — section appears with `— : —` placeholder content that looks broken before any time is selected | `App.tsx`, `ConversionDisplay.tsx` |
| UI-018 | PartyRoom header gets dense on mobile (320–375 px) — three-word room code + nickname + Leave button has no truncation or wrapping | `PartyRoom.tsx` |
