# Accessibility Audit — CollabTime

Audited via source analysis of all TSX components, `a11y.test.tsx`, `index.html`, and `index.css`.

Review date: 2026-03-23

Existing axe test coverage: 26 tests passing (`src/a11y.test.tsx`).

---

## Issues

### Critical

| Code | Issue | WCAG SC | Location |
|---|---|---|---|
| A11Y-001 | No focus trap implemented in any dialog — keyboard users can Tab out of overlays and interact with background content; Tab does not cycle within the dialog | 2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order | `PartyCreateOverlay.tsx`, `PartyJoinOverlay.tsx`, `LockInModal.tsx` |
| A11Y-002 | `LockInModal` is not keyboard-dismissable — the entire surface uses `onClick={onDismiss}` with no `onKeyDown` Escape handler and no focusable button inside; keyboard-only users must wait the full 2500ms auto-dismiss and cannot skip early | 2.1.1 Keyboard | `LockInModal.tsx` |

---

### High

| Code | Issue | WCAG SC | Location |
|---|---|---|---|
| A11Y-003 | `aria-live` placed directly on `<button>` elements is invalid per HTML-AAM — screen readers may ignore the "Copied!" / "Downloaded!" announcement entirely; the attribute must be on a non-interactive container | 4.1.2 Name, Role, Value | `ShareLink.tsx`, `CalendarExport.tsx`, `DiscordExport.tsx` |
| A11Y-004 | Timezone picker button in the header has no accessible name — a screen reader announces only the raw IANA ID (e.g. "America/New_York") with no indication this is a selector; add `aria-label="Select timezone"` | 4.1.2 Name, Role, Value | `App.tsx:109` |
| A11Y-005 | Discord expand/collapse button has `aria-expanded` but no `aria-controls` pointing to the region it toggles — screen readers cannot programmatically navigate from the button to the content it controls | 4.1.2 Name, Role, Value | `DiscordExport.tsx` |
| A11Y-006 | PartyCreateOverlay "Copy code" and "Copy link" buttons have no live region to announce the "Copied!" feedback — the state change is purely visual; there is no screen reader announcement at all (unlike the main `ShareLink` which at least attempts `aria-live` on the button, which is also wrong per A11Y-003) | 4.1.2 Name, Role, Value | `PartyCreateOverlay.tsx` |

---

### Medium

| Code | Issue | WCAG SC | Location |
|---|---|---|---|
| A11Y-007 | Tailwind utility `animate-pulse` is not guarded by `prefers-reduced-motion` — all five custom CSS animations in `index.css` have correct `prefers-reduced-motion` overrides, but Tailwind's generated `animate-pulse` does not; users who opt into reduced motion still see infinite pulsing | 2.3.3 Animation from Interactions | `ConversionDisplay.tsx:43`, `ConsensusMeter.tsx:48` |
| A11Y-008 | Empty state `— : —` in ConversionDisplay is meaningless to screen readers — a screen reader reads "dash dash colon dash dash"; should use visually-hidden text like "No time selected" or an `aria-label` on the container | 1.3.1 Info and Relationships | `ConversionDisplay.tsx` |
| A11Y-009 | Unicode `✓` checkmark rendered as bare text has no accessible label — screen readers say "check mark" with no semantic context; should be `aria-hidden="true"` with an adjacent `<span className="sr-only">Agreed</span>` | 1.1.1 Non-text Content | `ParticipantRow.tsx`, `PartyExportScreen.tsx` |
| A11Y-010 | `aria-invalid` is set on code inputs when format is wrong but there is no corresponding `aria-errormessage` id and no visible error text — screen readers announce "invalid entry" without explaining what is wrong; add a visible/hidden error message and wire it via `aria-errormessage` | 3.3.1 Error Identification, 3.3.3 Error Suggestion | `PartyJoinOverlay.tsx`, `PartyDeadRoom.tsx` |
| A11Y-011 | "Join a Party" button focus indicator uses `outline-gray-500` on `bg-gray-800` — this color combination may not meet the minimum 3:1 contrast ratio required for focus indicators under WCAG 2.2 | 2.4.11 Focus Appearance | `CoordinateSection.tsx` |

---

### Low

| Code | Issue | WCAG SC | Location |
|---|---|---|---|
| A11Y-012 | `RoomCodePill` renders only the raw room code string with no contextual label — a screen reader user navigating the `PartyRoom` header hears the code with no indication it is the room identifier; add `aria-label="Room code: amber-falcon-bridge"` or a visually-hidden prefix | 1.3.1 Info and Relationships | `RoomCodePill.tsx` |
| A11Y-013 | `DiscordIcon` component accepts `aria-hidden` as a prop but the `Props` interface only types `className` — the `aria-hidden="true"` passed from `DiscordExport.tsx` is silently dropped and never applied to the SVG; the SVG announces "Discord" inside a button that already announces "Discord timestamps" causing double-announcement | 1.1.1 Non-text Content | `DiscordIcon.tsx`, `DiscordExport.tsx` |
| A11Y-014 | `PartyExportScreen` and `PartyDeadRoom` render a `<div>` as their outermost element — these are full-screen views but omit the `<main>` landmark, unlike the solo mode `App.tsx`; screen reader users cannot use landmark navigation to jump to main content | 1.3.6 Identify Purpose | `PartyExportScreen.tsx`, `PartyDeadRoom.tsx` |
| A11Y-015 | When "Try a Different Code" is clicked in `PartyDeadRoom`, the input appears with `autoFocus` but no `aria-live` region or `role="status"` announces that new content has appeared — the sudden focus shift may be disorienting without context for non-visual users | 4.1.3 Status Messages | `PartyDeadRoom.tsx` |

---

## Confirmed Correct

- Heading hierarchy: `h1` → `h2` throughout all views, no skipped levels
- All five custom CSS animations guarded with `prefers-reduced-motion: reduce` in `index.css`
- `min-h-[44px]` consistently applied to all interactive buttons and inputs (except `TextImport` Parse button — see UI-003)
- `ManualSelector` uses `<label htmlFor>` correctly; `TextImport` textarea uses `aria-label`
- `aria-modal="true"` present on `PartyCreateOverlay` and `PartyJoinOverlay`
- `role="alertdialog"` correctly used on `LockInModal`
- `lang="en"` set on `<html>` in `index.html`
- Decorative emoji and icon elements correctly marked `aria-hidden="true"`
- `ProposalsBoard` uses `aria-live="polite"` on a non-interactive `<section>` container (correct placement)
- `ConsensusMeter` uses `role="progressbar"` with `aria-valuenow/min/max` and `aria-label="Consensus"`, plus `role="status"` text sibling
- `ReconnectingBanner` uses `role="alert"` for the urgent reconnection message
