# TWR-PUBLISH-001 — Live Reader Publish

**Status:** Complete · **2026-06-13**  
**Parent:** [TWR_MERGE_001.md](TWR_MERGE_001.md)

## What happened

`lostbook` `main` was pushed to [github.com/aerovista-us/lostbook](https://github.com/aerovista-us/lostbook). GitHub Pages (`main` / `/`) rebuilt automatically.

## Verification

| Check | Result |
|-------|--------|
| Pages status | `built` |
| Live URL | [aerovista-us.github.io/lostbook/almanac.html](https://aerovista-us.github.io/lostbook/almanac.html) |
| Manifest page count | 182 |
| TWR v1 entries | 8 (`twr_page_*`) |
| `twrMerge` block | `TWR-MERGE-001` present |

```bash
curl -s https://aerovista-us.github.io/lostbook/almanac-manifest.json | \
  python3 -c "import json,sys; m=json.load(sys.stdin); twr=[p for p in m['pages'] if 'twr_page' in p.get('html','')]; print(len(m['pages']), len(twr), m.get('twrMerge',{}).get('id'))"
# expect: 182 8 TWR-MERGE-001
```

## Note

Publish was triggered by the intentional `git push` after operator merge approval — not by artlocalized-api auto-publish. The M2 bridge remains preview-only.

## Next

- **TWR-DROP-002** — grow intake drop to 12/12 (separate content sprint)
- **M3** — Frontier HTTPS/WSS only when actually needed
