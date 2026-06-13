#!/usr/bin/env node
/**
 * TWR-MERGE-001 — Found Notebook v1 manual reader merge
 * Copies polished preview HTML into almanac/pages/ and appends manifest entries.
 * Does NOT publish to GitHub Pages.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
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
    file: 'twr_page_water_melt_snow.html',
    afterHtml: 'almanac/pages/water_11.html',
    entry: {
      html: 'almanac/pages/twr_page_water_melt_snow.html',
      title: 'Melt snow before you trust the cup',
      category: 'Water',
      note: 'TWR v1 · R. Vale · original',
      twrPageId: 'twr_page_water_melt_snow',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_water_creek_tells.html',
    afterHtml: 'almanac/pages/twr_page_water_melt_snow.html',
    entry: {
      html: 'almanac/pages/twr_page_water_creek_tells.html',
      title: 'The creek tells on the hill',
      category: 'Water',
      note: 'TWR v1 · unknown carrier · original',
      twrPageId: 'twr_page_water_creek_tells',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_fire_smoke_signature.html',
    afterHtml: 'almanac/pages/fire_07.html',
    entry: {
      html: 'almanac/pages/twr_page_fire_smoke_signature.html',
      title: 'Smoke is a signature',
      category: 'Fire',
      note: 'TWR v1 · R. Vale · original',
      twrPageId: 'twr_page_fire_smoke_signature',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_fire_one_coal.html',
    afterHtml: 'almanac/pages/twr_page_fire_smoke_signature.html',
    entry: {
      html: 'almanac/pages/twr_page_fire_one_coal.html',
      title: 'Keep one coal alive',
      category: 'Fire',
      note: 'TWR v1 · later hand · copied',
      twrPageId: 'twr_page_fire_one_coal',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_shelter_wind_heat.html',
    afterHtml: 'almanac/pages/shelter_09.html',
    entry: {
      html: 'almanac/pages/twr_page_shelter_wind_heat.html',
      title: 'Wind steals heat first',
      category: 'Shelter',
      note: 'TWR v1 · R. Vale · original',
      twrPageId: 'twr_page_shelter_wind_heat',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_shelter_not_ground.html',
    afterHtml: 'almanac/pages/twr_page_shelter_wind_heat.html',
    entry: {
      html: 'almanac/pages/twr_page_shelter_not_ground.html',
      title: 'Do not sleep on the ground',
      category: 'Shelter',
      note: 'TWR v1 · child note · margin',
      twrPageId: 'twr_page_shelter_not_ground',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_food_eat_slow.html',
    afterHtml: 'almanac/pages/food_07.html',
    entry: {
      html: 'almanac/pages/twr_page_food_eat_slow.html',
      title: 'Eat slow when you find plenty',
      category: 'Food',
      note: 'TWR v1 · trader · original',
      twrPageId: 'twr_page_food_eat_slow',
      twrMerge: 'TWR-MERGE-001',
    },
  },
  {
    file: 'twr_page_food_unlabeled_can.html',
    afterHtml: 'almanac/pages/twr_page_food_eat_slow.html',
    entry: {
      html: 'almanac/pages/twr_page_food_unlabeled_can.html',
      title: 'The can without a label',
      category: 'Food',
      note: 'TWR v1 · unknown carrier · relic',
      twrPageId: 'twr_page_food_unlabeled_can',
      twrMerge: 'TWR-MERGE-001',
    },
  },
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
  const existingTwr = pages.filter((p) => p.twrPageId).map((p) => p.twrPageId);

  if (existingTwr.length > 0) {
    throw new Error(`Manifest already contains TWR pages: ${existingTwr.join(', ')}`);
  }

  for (const item of MERGE_PLAN) {
    if (existingHtml.has(item.entry.html)) {
      throw new Error(`Manifest already has ${item.entry.html}`);
    }
    const idx = pages.findIndex((p) => p.html === item.afterHtml);
    if (idx === -1) throw new Error(`Anchor not found: ${item.afterHtml}`);
    pages.splice(idx + 1, 0, item.entry);
    existingHtml.add(item.entry.html);
  }

  manifest.twrMerge = {
    id: 'TWR-MERGE-001',
    mergedAt: new Date().toISOString(),
    dropId: 'twr_found_notebook_v1',
    pageCount: MERGE_PLAN.length,
    source: 'artlocalized-api/data/exports/twr/lostbook-preview/',
    note: 'Found Notebook v1 manual reader merge — no auto GitHub Pages publish',
  };

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest.pages.length;
}

const copied = [];
for (const item of MERGE_PLAN) {
  polishAndCopy(item.file);
  copied.push(item.file);
}

const totalPages = insertManifestEntries();
console.log(
  JSON.stringify(
    {
      ok: true,
      workOrder: 'TWR-MERGE-001',
      copied,
      manifestPageCount: totalPages,
      added: MERGE_PLAN.length,
    },
    null,
    2,
  ),
);
