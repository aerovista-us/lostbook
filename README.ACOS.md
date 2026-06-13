# Things Worth Remembering — lostbook (ACOS mirror)

**Live (GitHub Pages):** [aerovista-us.github.io/lostbook/almanac.html](https://aerovista-us.github.io/lostbook/almanac.html)  
**Upstream:** [github.com/aerovista-us/lostbook](https://github.com/aerovista-us/lostbook)  
**ACOS path:** `/srv/ACOS/Apps/lostbook/`

## Role in the TWR product lane

| Layer | What it is |
|-------|------------|
| **lostbook** (this folder) | Immersive notebook **reader** — page-flip almanac, `almanac-manifest.json`, `almanac/pages/*.html` |
| **artlocalized-api M2** | Operator **intake** + validation + `publishable` / `book-json` release filter |
| **AVCC project** | Workflow tracking (`pro_twr_things_worth_remembering`) |
| **Art Localized booth** | Public showcase shell on `aerovista.us` |

**M2 → lostbook bridge (preview only, no auto-publish):** M2 `book-json` drop exports to `almanac-manifest.generated.json` + `pages/*.html` under `services/artlocalized-api/data/exports/twr/lostbook-preview/`. Operator reviews before merging into this tree or pushing to GitHub Pages.

```bash
bash /srv/ACOS/services/artlocalized-api/ops/export-twr-lostbook-preview.sh
# or: cd services/artlocalized-api && npm run export:twr-lostbook-preview
```

## Local preview (canonical lostbook)

```bash
cd /srv/ACOS/Apps/lostbook
python3 -m http.server 8765
# open http://127.0.0.1:8765/almanac.html
```

## Sync from upstream

```bash
cd /srv/ACOS/Apps/lostbook
git pull origin main
```

Do not treat generated M2 preview files as replacements for this tree without operator review.

## Work order status

**Master ledger:** [docs/TWR_WORK_ORDERS.md](docs/TWR_WORK_ORDERS.md) — all TWR milestones, drops, merges, and publishes.

| Latest | Status |
|--------|--------|
| TWR-DROP-002 | ✅ 12/12 in M2 store |
| TWR-MERGE-002 | ✅ 12 TWR pages in ACOS reader (186 manifest pages) |
| TWR-PUBLISH-002 | 🔄 Pending — `git push` to update live reader |

## TWR-MERGE-001 — Found Notebook v1 manual reader merge

**Status:** Complete · **2026-06-13**  
**Work order:** TWR-MERGE-001  
**Source drop:** `twr_found_notebook_v1` (8/8 publishable `book-json` pages)

Merged 8 TWR v1 pages from `artlocalized-api` preview export into this reader tree. **No GitHub Pages publish** — merge is local to ACOS mirror only until `TWR-PUBLISH-001`.

| What | Detail |
|------|--------|
| HTML | `almanac/pages/twr_page_*.html` (8 new files — no existing pages overwritten) |
| Manifest | 8 entries appended per tab in `almanac-manifest.json` (174 → **182** pages) |
| Footer polish | Preview footers → `TWR v1` · `Found Copy No. 17 — Lake City / Kootenai` |
| Traceability | `twrPageId` + `twrMerge: TWR-MERGE-001` on manifest entries; `twrMerge` block on manifest root |

### Merged pages

| Tab | Page ID | Title |
|-----|---------|-------|
| Water | `twr_page_water_melt_snow` | Melt snow before you trust the cup |
| Water | `twr_page_water_creek_tells` | The creek tells on the hill |
| Fire | `twr_page_fire_smoke_signature` | Smoke is a signature |
| Fire | `twr_page_fire_one_coal` | Keep one coal alive |
| Food | `twr_page_food_eat_slow` | Eat slow when you find plenty |
| Food | `twr_page_food_unlabeled_can` | The can without a label |
| Shelter | `twr_page_shelter_wind_heat` | Wind steals heat first |
| Shelter | `twr_page_shelter_not_ground` | Do not sleep on the ground |

### Re-run merge (idempotent guard)

Merge script refuses overwrite if pages already exist:

```bash
node /srv/ACOS/Apps/lostbook/scripts/twr-merge-001.mjs
```

### Local preview after merge

```bash
cd /srv/ACOS/Apps/lostbook
python3 -m http.server 8765
# open http://127.0.0.1:8765/almanac.html
# TWR v1 pages appear in Water / Fire / Shelter / Food tab sections
```

**Next:** `TWR-PUBLISH-001` ✅ — 8 pages live. `TWR-DROP-002` ✅ · `TWR-MERGE-002` ✅ — 12 pages in ACOS reader.

## TWR-MERGE-002 — DROP-002 reader merge (+4 pages)

**Status:** Complete · **2026-06-13**  
**Docs:** [docs/TWR_MERGE_002.md](docs/TWR_MERGE_002.md)

| Tab | Page ID | Title |
|-----|---------|-------|
| Travel | `twr_page_travel_mark_only_you` | Leave a mark only you will read |
| Mistakes | `twr_page_mistakes_shortcut` | I trusted the shortcut |
| People | `twr_page_people_warmth_not_story` | Share warmth, not your whole story |
| Signals | `twr_page_signals_three_knocks` | Three knocks means come in |

```bash
node /srv/ACOS/Apps/lostbook/scripts/twr-merge-002.mjs
```

Manifest: 182 → **186** pages · **12** total TWR pages.

**Next:** `TWR-PUBLISH-002` — push `main` to update [live almanac](https://aerovista-us.github.io/lostbook/almanac.html).
