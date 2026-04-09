# PR Review: Polish / Nice-to-Have

These are low-priority improvements. Good candidates for a follow-up PR or to batch into a cleanup pass.

---

## P1 — `ProposeCtaBar` gives no hint why the button is disabled in `waiting` phase

**File:** `src/components/party/ProposeCtaBar.tsx:11`

The button is disabled when `roomPhase !== 'active'`, but there's no UI explanation. First-time users in the `waiting` phase won't know why they can't propose.

**Fix:** Add a subtle helper text below the button when `roomPhase === 'waiting'`:
```tsx
{roomPhase === 'waiting' && (
  <p className="text-xs text-gray-500 text-center mt-1">
    Waiting for the host to start the session…
  </p>
)}
```

---

## P2 — `PartyCreateOverlay` has no explicit close/X button

**File:** `src/components/party/PartyCreateOverlay.tsx`

Dismissal is only via clicking the backdrop or pressing Escape. Standard modal UX includes a visible close button. Some users (especially mobile) won't discover the backdrop-click pattern.

**Fix:** Add an X button in the top-right corner of the dialog panel.

---

## P3 — `LockInModal` doesn't use `useFocusTrap`; no focus restoration on dismiss

**File:** `src/components/party/LockInModal.tsx:13-31`

`LockInModal` has its own ad-hoc focus and keyboard management instead of using the existing `useFocusTrap` hook. It correctly focuses itself on mount and handles Escape, but it doesn't restore focus to the previously-focused element on dismiss (unlike `useFocusTrap` which does this via `previouslyFocused?.focus()` on cleanup).

Since the modal is full-screen with no interactive elements beneath it, focus restoration matters most for keyboard users who dismissed it via Escape.

---

## P4 — `RoomCodePill` is display-only once inside the room

**File:** `src/components/party/RoomCodePill.tsx`

The room code is shown in the party room header but can't be clicked to copy. Users who want to re-share the code after entering the room have no quick way to grab it.

**Fix:** Add a copy-on-click button next to or wrapping the room code, with a brief "Copied!" feedback state (same pattern as `PartyCreateOverlay`).

---

## P5 — `PartyDeadRoom` retry requires two interactions

**File:** `src/components/party/PartyDeadRoom.tsx:32`

Users who hit "Room not found" must: (1) click "Try a Different Code" to reveal the input, then (2) focus and type in it. Two steps for an already-frustrated user.

**Fix:** Show the code input field by default rather than hiding it behind a toggle button. Remove the `showInput` state and always render the input + "Join" button.

---

## P6 — `ProposalsBoard` aside has no max-height on mobile

**File:** `src/components/party/PartyRoom.tsx:100`

On mobile with many participants (8+), the proposals column (`<aside>`) can grow very tall and push the time picker far out of view. The `overflow-y-auto` is there but without a `max-height` constraint, the container just expands.

**Fix:** Add `max-h-[40vh]` (or similar) on mobile, keeping it unconstrained on `md:` and up.

---

## P7 — Party room header is too dense at 320–375px

**File:** `src/components/party/PartyRoom.tsx:81-93`

The header contains: `[room-code-pill] [nickname] ... [Leave button]`. A three-word room code like `happy-sleepy-banana` plus a nickname like `QuickFox` barely leaves room for the "Leave" button on narrow phones with no responsive adjustments.

**Fix:** On mobile, consider stacking the room code and nickname vertically in the left group (`flex-col`) rather than horizontally.

---

## P8 — `pt-[52px]` is a magic number tied to the reconnect banner height

**File:** `src/components/party/PartyRoom.tsx:68`

```tsx
className={`min-h-screen bg-gray-950 text-gray-100 flex flex-col ${isReconnecting ? 'pt-[52px]' : ''}`}
```

If the `ReconnectingBanner` ever wraps to two lines (narrow viewport), `52px` won't be enough and content will overlap. The value is not documented or tied to the banner's actual height.

**Fix:** Document the magic number, or dynamically measure the banner height (e.g. via a `ref` and `ResizeObserver`).

---

## P9 — `pb-24` bottom padding doesn't account for `keyboardInset`

**File:** `src/components/party/PartyRoom.tsx:121`

The `pb-24` (96px) is intended to clear the fixed `ProposeCtaBar`. But `ProposeCtaBar` uses `bottom: keyboardInset` — when the virtual keyboard is open on mobile, the bar moves up. The static `pb-24` doesn't track this and content may be hidden behind the bar.

**Fix:** Pass `keyboardInset` down and compute `paddingBottom` dynamically, or use a CSS custom property.

---

## P10 — "All {count} on board" microcopy is grammatically awkward

**File:** `src/components/party/LockInModal.tsx:64`

"All 3 on board" is unclear — on board what? Consider:
- "All 3 participants agree"
- "Everyone is locked in"
- "3 of 3 agreed"

---

## P11 — "Tap anywhere to continue" hint has low contrast

**File:** `src/components/party/LockInModal.tsx:68`

`text-gray-600` on a `bg-gray-950/95` background is approximately 2.3:1 — below WCAG AA (4.5:1 for small text).

**Fix:** Change to `text-gray-400` (~5:1 contrast).

---

## P12 — `PartyExportScreen` has no unit test file

**File:** `src/components/party/PartyExportScreen.tsx`

This component is only covered by E2E tests. Unit test gaps include:
- Rendering with `participants=[]` (deep-link path)
- Rendering with non-empty participants
- `onNewSession` and `onBackToSolo` callback invocations

---

## P13 — `useRoom.test.ts` missing edge case coverage

**File:** `src/hooks/useRoom.test.ts`

Notable gaps:
- `onClose` fires while already in `reconnecting` phase (should it stay reconnecting or fail?)
- Grace period countdown reaches 0 — what actually happens?
- `room_activated` message with an empty `participants` array
- `proposal_updated` for a `participantToken` not present in the participants list (orphaned proposal)
- `participant_reconnected` for an unknown participant (should be a safe no-op)
