# TWR-DRAWN-ICON-PACK-001 — Hand-Drawn Survival Notebook Icons

**Date:** 2026-06-13  
**Status:** Shipped (starter pack v1 — 12 icons)  
**Reader target:** `Apps/lostbook`  

## Goal

Emoji placeholders remain valid in authoring/source (`💧`, `🔥`, `⛺`, etc.). The Lostbook reader renders them as **hand-drawn pencil/pen field sketches** — instructional diagrams, not emoji or glossy UI icons.

## Starter pack (12 icons)

| Emoji | File | Teaches |
|-------|------|---------|
| ⛺ / 🏠 | `twr-icon-camp.svg` | Tent placement, wind, drainage, fire downwind |
| 🔥 | `twr-icon-fire-lay.svg` | Tinder / kindling / fuel layers |
| 💧 | `twr-icon-water-filter.svg` | Jar filter layers, slow drip |
| 🧭 / 🛤 | `twr-icon-travel.svg` | Compass + shadow direction |
| 🪨 | `twr-icon-trail-mark.svg` | Secret stone mark vs obvious blaze |
| 🚪 / 📡 | `twr-icon-knock-code.svg` | Door knock code |
| ⚠️ | `twr-icon-warning.svg` | Hand-drawn warning triangle |
| 🤝 / 👥 | `twr-icon-trade-people.svg` | Trade first — maps/names held back |
| 🪢 | `twr-icon-knot.svg` | Standing part / tail out |
| 🪓 | `twr-icon-tool-axe.svg` | Swing zone + foot clearance |
| 🍲 | `twr-icon-shared-warmth.svg` | Warmth yes, story no |
| ❌ | `twr-icon-mistake.svg` | Crossed-out bad setup |

## File layout

```
Apps/lostbook/assets/twr-icons/
  manifest.json
  svg/twr-icon-*.svg
  source/twr-icon-camp.prompt.md
Apps/lostbook/assets/css/twr-icons.css
Apps/lostbook/assets/js/twr-icons.mjs
Apps/lostbook/scripts/twr-replace-emoji-icons.mjs
```

## Runtime replacement

`almanac.mjs` imports `twr-icons.mjs` and transforms page HTML after fetch:

- `.found-tab` / `.fp-cat` headers → `twr-icon--tab` size
- Mapped emoji in body HTML → inline `twr-icon` spans
- Side tape tabs → drawn symbols when mapped

Unmapped emojis (🌧, 📍, 🔧, etc.) stay as emoji until future packs.

## Static replacement (optional)

```bash
node scripts/twr-replace-emoji-icons.mjs --dry-run
node scripts/twr-replace-emoji-icons.mjs --twr-only
```

Not run automatically on merge — icon meanings can be context-sensitive.

## Usage in HTML

```html
<div class="twr-icon-card">
  <span class="twr-icon twr-icon--camp twr-icon--lg" aria-hidden="true"></span>
  <p>
    Camp above the water line. Keep the door out of the wind.
    <small>Fire downwind. Drainage before comfort.</small>
  </p>
</div>
```

## Next packs (not started)

DROWN expansion: Weather, Navigation map, First aid, Gear, Notes, Tracks, Light, Fishing, Traps, Security — per reference sheet.
