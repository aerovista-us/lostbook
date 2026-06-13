# TWR Product Lane — Work Order Status

**Last updated:** 2026-06-13  
**Lane:** Frontier WT / Things Worth Remembering  
**Blueprint:** [FRONTIER_WT_PRODUCT_LANE.md](../../../docs/FRONTIER_WT_PRODUCT_LANE.md) (ACOS share) · [product-lane copy](../../../aerovista-command-center/docs/product-lane/FRONTIER_WT_PRODUCT_LANE.md) (ACOS repo)

## Summary

| Phase | Status |
|-------|--------|
| Intake + API pipeline | ✅ Complete (M1–M2.5) |
| Found Notebook v1 content | ✅ 12/12 target |
| Live reader (lostbook) | ✅ 12 TWR pages merged locally · publish on git push |
| Frontier HTTPS (M3) | ⏸ Parked |

---

## Milestones (infra)

| ID | Name | Status | Completed | Notes |
|----|------|--------|-----------|-------|
| **M1** | AVCC intake proof | ✅ Complete | 2026-06-12 | Project `pro_twr_things_worth_remembering`, intake v1 schema, drop scoped |
| **M2** | artlocalized-api builder wire-up | ✅ Complete | 2026-06-12 | `/api/art-localized/builders/twr/notebook` |
| **M2.5** | lostbook preview bridge | ✅ Complete | 2026-06-13 | `twrLostbookExport.js`, preview-only export |
| **M3** | Frontier HTTPS/WSS lane | ⏸ Parked | — | Do not start until PTT infra needed |
| **M4** | AVCC embed | ⏸ Not started | — | After M3 |
| **M5** | Publish drop (ongoing) | 🔄 Active | — | Content + reader updates |

---

## Content & reader work orders

| ID | Name | Status | Completed | Deliverable |
|----|------|--------|-----------|-------------|
| **TWR-DROP-001** | Grow v1 to 8/8 minimum | ✅ Complete | 2026-06-13 | 8 publishable pages · required tabs |
| **TWR-MERGE-001** | Manual reader merge (8 pages) | ✅ Complete | 2026-06-13 | `Apps/lostbook/almanac/pages/twr_page_*` ×8 |
| **TWR-PUBLISH-001** | Live GitHub Pages (8 pages) | ✅ Complete | 2026-06-13 | [live almanac](https://aerovista-us.github.io/lostbook/almanac.html) |
| **TWR-DROP-002** | Grow to 12/12 target | ✅ Complete | 2026-06-13 | +4 optional-tab pages |
| **TWR-MERGE-002** | Manual reader merge (+4 pages) | ✅ Complete | 2026-06-13 | 12 TWR pages in ACOS reader |
| **TWR-PUBLISH-002** | Live GitHub Pages (12 pages) | 🔄 Pending | — | `git push` lostbook `main` after MERGE-002 review |

---

## ACOS cleanup work orders (related)

| ID | Name | Status | Notes |
|----|------|--------|-------|
| **WO-CLEAN-001** | AeroCore symlink | ✅ Complete | `/srv/ACOS/AeroCore` → `AeroVistaCore` |
| **WO-CLEAN-002** | — | ⏸ Open | See `docs/ACOS_CLEANUP_WORK_ORDERS.md` |
| **WO-CLEAN-003** | AVCC tab refs | ⏸ Open | Pre-existing n8n/integrations mismatch |
| **WO-CLEAN-004–008** | Registry/tree hygiene | ⏸ Open | Documented in cleanup WOs |

---

## Repositories

| Repo | Role | TWR artifacts |
|------|------|---------------|
| [artlocalized-api](https://github.com/aerovista-us/artlocalized-api) | M2 intake + export | `data/twr/notebook-pages.json` (12 pages) |
| [lostbook](https://github.com/aerovista-us/lostbook) | Canonical reader | `almanac/pages/twr_page_*.html` |
| [ACOS](https://github.com/aerovista-us/ACOS) | AVCC + contracts | `backend/contracts/twr/`, seed scripts |

---

## Current operator action

1. Review 4 new pages locally: `cd Apps/lostbook && python3 -m http.server 8765`
2. **TWR-PUBLISH-002** — `git push` lostbook when approved
3. M3 remains parked

## Doc index

| Work order | Doc |
|------------|-----|
| TWR-DROP-001 | `services/artlocalized-api/docs/TWR_DROP_001.md` |
| TWR-DROP-002 | `services/artlocalized-api/docs/TWR_DROP_002.md` |
| TWR-MERGE-001 | `Apps/lostbook/docs/TWR_MERGE_001.md` |
| TWR-MERGE-002 | `Apps/lostbook/docs/TWR_MERGE_002.md` |
| TWR-PUBLISH-001 | `Apps/lostbook/docs/TWR_PUBLISH_001.md` |
| M2 wire-up | `services/artlocalized-api/docs/M2_TWR_BUILDER_WIREUP.md` |
