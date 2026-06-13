#!/usr/bin/env node
/**
 * TWR-MERGE-002 — Found Notebook v1 DROP-002 reader merge (+4 pages)
 * Requires TWR-MERGE-001 pages already present. Idempotent — refuses overwrite.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOSTBOOK_ROOT = join(__dirname, '..');
const PREVIEW_DIR = join(
  LOSTBOOK_ROOT,
  '../../services/artlocalized-api/data/exports/twr/lostbook-preview/pages',
);
const PAGES_DIR = join(LOSTBOOK_ROOT, 'almanac/pages');
const MANIFEST_PATH = join(LOSTBOOK_ROOT, 'almanac-manifest.json');

const EDITION = 'Found Copy No. 17 — Lake City / Kootenai';
const FOOTER_PREVIEW =
  /<footer class="fp-foot"><span>M2 preview<\/span><span class="fp-edition">Generated from artlocalized-api · not live lostbook<\/span><\/footer>/;
const FOOTER_MERGED = `<footer class="fp-foot"><span>TWR v1</span><span class="fp-edition">${EDITION}</span></footer>`;

/** @type {Array<{ file: string, afterHtml: string, entry: Record<string, string> }>} */
const MERGE_PLAN = [
  {
    file: 'twr_page_travel_mark_only_you.html',
    afterHtml: 'almanac/pages/roads_13.html',
    entry: {
      html: 'almanac/pages/twr_page_travel_mark_only_you.html',
      title: 'Leave a mark only you will read',
      category: 'Travel',
      note: 'TWR v1 · R. Vale · original',
      twrPageId: 'twr_page_travel_mark_only_you',
      twrMerge: 'TWR-MERGE-002',
    },
  },
  {
    file: 'twr_page_mistakes_shortcut.html',
    afterHtml: 'almanac/pages/twr_page_travel_mark_only_you.html',
    entry: {
      html: 'almanac/pages/twr_page_mistakes_shortcut.html',
      title: 'I trusted the shortcut',
      category: 'Mistakes',
      note: 'TWR v1 · unknown carrier · correction',
      twrPageId: 'twr_page_mistakes_shortcut',
      twrMerge: 'TWR-MERGE-002',
    },
  },
  {
    file: 'twr_page_people_warmth_not_story.html',
    afterHtml: 'almanac/pages/people_17.html',
    entry: {
      html: 'almanac/pages/twr_page_people_warmth_not_story.html',
      title: 'Share warmth, not your whole story',
      category: 'People',
      note: 'TWR v1 · trader · original',
      twrPageId: 'twr_page_people_warmth_not_story',
      twrMerge: 'TWR-MERGE-002',
    },
  },
  {
    file: 'twr_page_signals_three_knocks.html',
    afterHtml: 'almanac/pages/signals_11.html',
    entry: {
      html: 'almanac/pages/twr_page_signals_three_knocks.html',
      title: 'Three knocks means come in',
      category: 'Signals',
      note: 'TWR v1 · later hand · copied',
      twrPageId: 'twr_page_signals_three_knocks',
      twrMerge: 'TWR-MERGE-002',
    },
  },
];

const MERGE_001_PAGES = [
  'twr_page_water_melt_snow',
  'twr_page_water_creek_tells',
  'twr_page_fire_smoke_signature',
  'twr_page_fire_one_coal',
  'twr_page_shelter_wind_heat',
  'twr_page_shelter_not_ground',
  'twr_page_food_eat_slow',
  'twr_page_food_unlabeled_can',
];

function polishAndCopy(filename) {
  const src = join(PREVIEW_DIR, filename);
  const dest = join(PAGES_DIR, filename);
  if (!existsSync(src)) throw new Error(`Preview missing: ${src}`);
  if (existsSync(dest)) throw new Error(`Refusing to overwrite existing page: ${dest}`);
  let html = readFileSync(src, 'utf8');
  if (!FOOTER_PREVIEW.test(html)) {
    throw new Error(`Preview footer not found in ${filename} — already merged?`);
  }
  html = html.replace(FOOTER_PREVIEW, FOOTER_MERGED);
  writeFileSync(dest, html.endsWith('\n') ? html : `${html}\n`, 'utf8');
}

function insertManifestEntries() {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const pages = manifest.pages;
  const existingHtml = new Set(pages.map((p) => p.html));
  const existingTwrIds = new Set(pages.filter((p) => p.twrPageId).map((p) => p.twrPageId));

  for (const id of MERGE_001_PAGES) {
    if (!existingTwrIds.has(id)) {
      throw new Error(`TWR-MERGE-001 prerequisite missing in manifest: ${id}`);
    }
  }

  for (const item of MERGE_PLAN) {
    if (existingHtml.has(item.entry.html) || existingTwrIds.has(item.entry.twrPageId)) {
      throw new Error(`Already merged: ${item.entry.twrPageId}`);
    }
    const idx = pages.findIndex((p) => p.html === item.afterHtml);
    if (idx === -1) throw new Error(`Anchor not found: ${item.afterHtml}`);
    pages.splice(idx + 1, 0, item.entry);
    existingHtml.add(item.entry.html);
    existingTwrIds.add(item.entry.twrPageId);
  }

  const mergedAt = new Date().toISOString();
  const history = Array.isArray(manifest.twrMerges) ? manifest.twrMerges : [];
  if (manifest.twrMerge?.id === 'TWR-MERGE-001' && !history.some((m) => m.id === 'TWR-MERGE-001')) {
    history.push({ ...manifest.twrMerge });
  }
  history.push({
    id: 'TWR-MERGE-002',
    mergedAt,
    dropId: 'twr_found_notebook_v1',
    workOrder: 'TWR-DROP-002',
    pageCount: MERGE_PLAN.length,
    cumulativeTwrPages: 12,
    source: 'artlocalized-api/data/exports/twr/lostbook-preview/',
    note: 'DROP-002 optional-tab pages — manual merge, no auto-publish',
  });
  manifest.twrMerges = history;
  manifest.twrMerge = {
    id: 'TWR-MERGE-002',
    mergedAt,
    dropId: 'twr_found_notebook_v1',
    pageCount: 12,
    addedThisMerge: MERGE_PLAN.length,
    source: 'artlocalized-api/data/exports/twr/lostbook-preview/',
    note: 'Found Notebook v1 complete (12/12) in ACOS reader — push to GitHub for live update',
  };

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return {
    total: manifest.pages.length,
    twrCount: pages.filter((p) => p.twrPageId).length,
  };
}

const copied = [];
for (const item of MERGE_PLAN) {
  polishAndCopy(item.file);
  copied.push(item.file);
}

const { total, twrCount } = insertManifestEntries();
console.log(
  JSON.stringify(
    {
      ok: true,
      workOrder: 'TWR-MERGE-002',
      copied,
      manifestPageCount: total,
      twrPageCount: twrCount,
      added: MERGE_PLAN.length,
    },
    null,
    2,
  ),
);
