# TWR Product Lane — Work Order Status

**Last updated:** 2026-06-13  
**Lane:** Frontier WT / Things Worth Remembering  
**Blueprint:** [FRONTIER_WT_PRODUCT_LANE.md](../../../docs/FRONTIER_WT_PRODUCT_LANE.md) (ACOS share) · [product-lane copy](../../../aerovista-command-center/docs/product-lane/FRONTIER_WT_PRODUCT_LANE.md) (ACOS repo)

## Summary

| Phase | Status |
|-------|--------|
| Intake + API pipeline | ✅ Complete (M1–M2.5) |
| Found Notebook v1 content | ✅ Complete (12/12) |
| Found Notebook v1 reader lane | ✅ Complete |
| Live reader (lostbook) | ✅ 12 TWR pages on GitHub Pages |
| Artifact polish (v1) | ✅ TWR-POLISH-001 |
| Frontier HTTPS (M3) | ⏸ Parked |

**Found Notebook v1 lane:** `AVCC intake → artlocalized-api → preview bridge → 12/12 drop → lostbook merge → GitHub Pages → polish`

---

## Milestones (infra)

| ID | Name | Status | Completed | Notes |
|----|------|--------|-----------|-------|
| **M1** | AVCC intake proof | ✅ Complete | 2026-06-12 | Project `pro_twr_things_worth_remembering`, intake v1 schema |
| **M2** | artlocalized-api builder wire-up | ✅ Complete | 2026-06-12 | `/api/art-localized/builders/twr/notebook` |
| **M2.5** | lostbook preview bridge | ✅ Complete | 2026-06-13 | `twrLostbookExport.js`, preview-only export |
| **M3** | Frontier HTTPS/WSS lane | ⏸ Parked | — | Do not start until PTT infra needed |
| **M4** | AVCC embed | ⏸ Not started | — | After M3 |
| **M5** | Publish drop (ongoing) | ✅ v1 closed | 2026-06-13 | Future drops: TWR-DROP-003+ |

---

## Content & reader work orders

| ID | Name | Status | Completed | Deliverable |
|----|------|--------|-----------|-------------|
| **TWR-DROP-001** | Grow v1 to 8/8 minimum | ✅ Complete | 2026-06-13 | 8 publishable pages · required tabs |
| **TWR-MERGE-001** | Manual reader merge (8 pages) | ✅ Complete | 2026-06-13 | 8 `twr_page_*` in lostbook |
| **TWR-PUBLISH-001** | Live GitHub Pages (8 pages) | ✅ Complete | 2026-06-13 | First live TWR pages |
| **TWR-DROP-002** | Grow to 12/12 target | ✅ Complete | 2026-06-13 | +4 optional-tab pages |
| **TWR-MERGE-002** | Manual reader merge (+4 pages) | ✅ Complete | 2026-06-13 | 12 TWR in ACOS reader |
| **TWR-PUBLISH-002** | Live GitHub Pages (12 pages) | ✅ Complete | 2026-06-13 | Live manifest **186 / 12** verified |
| **TWR-POLISH-001** | v1 artifact style polish | ✅ Complete | 2026-06-13 | CSS layer + 12 page wrappers |

---

## ACOS cleanup work orders (related)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| **WO-CLEAN-001** | AeroCore symlink | ✅ Complete | `/srv/ACOS/AeroCore` → `AeroVistaCore` |
| **WO-CLEAN-002** | Tree/doc path fixes | ⏸ Open | See `docs/ACOS_CLEANUP_WORK_ORDERS.md` |
| **WO-CLEAN-003** | AVCC tab refs | ⏸ Open | Pre-existing n8n/integrations mismatch |
| **WO-CLEAN-004–008** | Registry/tree hygiene | ⏸ Open | Documented in cleanup WOs |

---

## Repositories

| Repo | Role | TWR artifacts |
|------|------|---------------|
| [artlocalized-api](https://github.com/aerovista-us/artlocalized-api) | M2 intake + export | `data/twr/notebook-pages.json` (12 pages) |
| [lostbook](https://github.com/aerovista-us/lostbook) | Canonical reader | `almanac/pages/twr_page_*.html` ×12 |
| [ACOS](https://github.com/aerovista-us/ACOS) | AVCC + contracts | `backend/contracts/twr/`, seed scripts |

---

## Current truth state

| Area | Status |
|------|--------|
| M2 store | 12 publishable `book-json` pages |
| Live manifest | 186 total · 12 TWR |
| `twrMerge` | `TWR-MERGE-002` |
| M3 | Parked |
| Next content (optional) | TWR-DROP-003 — only with specific story gap |

## Current operator action

Found Notebook v1 reader lane is **closed**. No required operator action.

Optional: spot-check polished pages locally, then begin TWR-DROP-003 only when a story gap is identified.

## Doc index

| Work order | Doc |
|------------|-----|
| Master ledger | `Apps/lostbook/docs/TWR_WORK_ORDERS.md` |
| TWR-DROP-001 | `services/artlocalized-api/docs/TWR_DROP_001.md` |
| TWR-DROP-002 | `services/artlocalized-api/docs/TWR_DROP_002.md` |
| TWR-MERGE-001 | `Apps/lostbook/docs/TWR_MERGE_001.md` |
| TWR-MERGE-002 | `Apps/lostbook/docs/TWR_MERGE_002.md` |
| TWR-PUBLISH-001 | `Apps/lostbook/docs/TWR_PUBLISH_001.md` |
| TWR-PUBLISH-002 | `Apps/lostbook/docs/TWR_PUBLISH_002.md` |
| TWR-POLISH-001 | `Apps/lostbook/docs/TWR_POLISH_001.md` |
| M2 wire-up | `services/artlocalized-api/docs/M2_TWR_BUILDER_WIREUP.md` |
