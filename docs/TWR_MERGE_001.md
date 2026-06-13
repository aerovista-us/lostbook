# TWR-MERGE-001 — Found Notebook v1 Manual Reader Merge

**Status:** Complete · **2026-06-13**  
**Parent:** [FRONTIER_WT_PRODUCT_LANE.md](../../../docs/FRONTIER_WT_PRODUCT_LANE.md)  
**Reader:** [Apps/lostbook/README.ACOS.md](../README.ACOS.md)

## Goal

Review M2 lostbook preview export → polish → manually merge into `Apps/lostbook` without auto-publishing to GitHub Pages.

## What was merged

- **8 HTML files** → `Apps/lostbook/almanac/pages/twr_page_*.html`
- **8 manifest entries** → `Apps/lostbook/almanac-manifest.json` (per-tab append)
- **Manifest metadata** → root `twrMerge` block for traceability

## Acceptance — met

- [x] Reviewed all 8 generated HTML pages (titles, tabs, margins, relics, voices)
- [x] Polished footers to lostbook edition style
- [x] Copied into `almanac/pages/` — **no existing files overwritten**
- [x] Manifest entries merged with `almanac/pages/` paths
- [x] Local static preview: 182 manifest pages, 8 TWR entries
- [x] Merge note in `README.ACOS.md`
- [x] GitHub Pages publish remains manual

## Script

```bash
node /srv/ACOS/Apps/lostbook/scripts/twr-merge-001.mjs
```

Idempotent: aborts if `twr_page_*.html` already exists in pages dir or manifest.

## Verify

```bash
cd /srv/ACOS/Apps/lostbook
python3 -m http.server 8765
curl -s http://127.0.0.1:8765/almanac-manifest.json | python3 -c \
  "import json,sys; m=json.load(sys.stdin); print(len(m['pages']), m.get('twrMerge'))"
```

## Sequence after merge

```
TWR-MERGE-001 ✅
→ TWR-PUBLISH-001 (manual git push to GitHub Pages)
→ TWR-DROP-002 (grow to 12/12)
→ M3 only when Frontier HTTPS/WSS is actually needed
```
