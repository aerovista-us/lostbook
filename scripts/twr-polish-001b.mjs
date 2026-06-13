#!/usr/bin/env node
/**
 * TWR-POLISH-001b — strengthen visible artifact layers on 12 TWR pages.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '../almanac/pages');

/** @type {Record<string, { stain: string, stamp?: string }>} */
const ENHANCE = {
  twr_page_water_melt_snow: { stain: 'fp-stain--water', stamp: '<span class="twr-stamp">Field original</span>' },
  twr_page_water_creek_tells: { stain: 'fp-stain--water' },
  twr_page_fire_smoke_signature: { stain: 'fp-stain--burn', stamp: '<span class="twr-stamp">Field original</span>' },
  twr_page_fire_one_coal: { stain: 'fp-stain--burn' },
  twr_page_food_eat_slow: { stain: 'fp-stain--smudge', stamp: '<span class="twr-stamp">Trader note</span>' },
  twr_page_food_unlabeled_can: { stain: 'fp-stain--ring' },
  twr_page_shelter_wind_heat: { stain: 'fp-stain--smudge' },
  twr_page_shelter_not_ground: { stain: 'fp-stain--smudge', stamp: '<span class="twr-stamp">Child margin</span>' },
  twr_page_travel_mark_only_you: { stain: 'fp-stain--smudge' },
  twr_page_mistakes_shortcut: { stain: 'fp-stain--burn' },
  twr_page_people_warmth_not_story: { stain: 'fp-stain--ring' },
  twr_page_signals_three_knocks: { stain: 'fp-stain--smudge' },
};

function enhanceFile(filename) {
  const pageId = filename.replace('.html', '');
  const cfg = ENHANCE[pageId];
  if (!cfg) return { file: filename, skipped: true };

  const path = join(PAGES_DIR, filename);
  let html = readFileSync(path, 'utf8');

  if (!html.includes('twr-field-mark')) {
    html = html.replace(
      /(<div class="fp-page-wear fp-page-wear--br"><\/div>)/,
      `$1\n  <span class="twr-field-mark" aria-hidden="true">TWR · v1</span>`,
    );
  }

  if (!html.includes('class="fp-stain') && cfg.stain) {
    const stain = `  <div class="fp-stain ${cfg.stain}"></div>`;
    if (html.includes('twr-field-mark')) {
      html = html.replace(
        /(<span class="twr-field-mark"[^>]*>[^<]*<\/span>)/,
        `$1\n${stain}`,
      );
    } else {
      html = html.replace(
        /(<div class="fp-page-wear fp-page-wear--br"><\/div>)/,
        `$1\n${stain}`,
      );
    }
  }

  if (cfg.stamp && !html.includes('twr-stamp') && html.includes('<h1 class="fp-title')) {
    html = html.replace(
      /(<span class="fp-cat found-tab">[^<]+<\/span>)/,
      `$1\n    ${cfg.stamp}`,
    );
  }

  writeFileSync(path, html.endsWith('\n') ? html : `${html}\n`, 'utf8');
  return { file: filename, enhanced: true };
}

const results = readdirSync(PAGES_DIR)
  .filter((f) => f.startsWith('twr_page_') && f.endsWith('.html'))
  .map(enhanceFile);

console.log(JSON.stringify({ ok: true, workOrder: 'TWR-POLISH-001b', results }, null, 2));
