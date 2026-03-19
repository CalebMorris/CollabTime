# Collab Time

## Setup

After `npm install`, install the Playwright browser binary (one-time):

```
npx playwright install chromium
```

Then take screenshots across all form factors:

```
npm run screenshots
```

Output: `docs/screenshots/{mobile-sm,mobile-lg,tablet,desktop,desktop-wide}.png`

---

Rough idea: Simple JackBox-style way to coordinate timing of an event between multiple people that live in different regions and timezones.

Planned phases:
* Initial static page - single user flow to make it dead-easy to convert between time-zones and share with others
* Multi-user coordination - multiple users in a "room" that can make suggestions for a given time in their individual time-zones that the other users see in their local time-zones. People can approve/reject/suggest similar to calendar flows

# Features - MVP

## Settings - My Time Zone

Default to the zone pulled from the browser, this should be a time-zone that the user can update to a specific value if the detection is wrong.

## Export - Discord Format

Preview the specific timestamp in the various Discord [formats](https://gist.github.com/LeviSnoot/d9147767abeef2f770e9ddcd91eb85aa), grouped in a discord section. Allow for easy click-to-copy for the syntax (ex: `<t:1543392060:f>`).

## Export - Deep Link

Link that takes a user to [[Collab Time]] with a preconfigured timestamp selected.

# User Stories - Solo

## Import From Text

I am a general user trying to make sure I have my schedule aligned with an event. Sometimes when I see a particular date of an event, I get confused and mix up when it's actually happening when I convert to my time-zone.

If I copy, or just type out, a specific timestamp with timezone, the website should attempt to parse it for usage in the conversion. If unable to parse there should be human-readable indications why it's not working.

## Manual Selecting Time

I am a general user trying to make sure I have my schedule aligned with an event. Sometimes when I see a particular date of an event, I get confused and mix up when it's actually happening when I convert to my time-zone.

I should be able to select a given time-zone and time by way of some UI elements (a clock input or a click-and-select), and have it convert to my own timezone.
