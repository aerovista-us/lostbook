#!/usr/bin/env node
/**
 * TWR-POLISH-001 — apply artifact classes and markup to 12 TWR pages.
 * Idempotent: skips files already containing twr-page class.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '../almanac/pages');

/** @type {Record<string, { extraClasses: string, style: string, stamp?: string, bodyExtra?: string, footerNote?: string }>} */
const POLISH = {
  twr_page_water_melt_snow: {
    extraClasses: 'twr-page twr-page--original',
    style: '--twr-page-tilt:-0.12deg; --twr-stain-x:70%; --twr-stain-y:22%',
    stamp: '',
    footerNote: 'found · carried · amended',
  },
  twr_page_water_creek_tells: {
    extraClasses: 'twr-page twr-page--original',
    style: '--twr-page-tilt:-0.08deg; --twr-stain-x:62%; --twr-stain-y:14%',
    footerNote: 'found · carried · amended',
  },
  twr_page_fire_smoke_signature: {
    extraClasses: 'twr-page twr-page--original',
    style: '--twr-page-tilt:-0.15deg; --twr-stain-x:24%; --twr-stain-y:68%',
    bodyExtra: '',
    footerNote: 'found · carried · amended',
  },
  twr_page_fire_one_coal: {
    extraClasses: 'twr-page twr-page--copied',
    style: '--twr-page-tilt:0.18deg; --twr-wear-opacity:0.86',
    stamp: '<span class="twr-stamp is-copied">Copied at winter camp</span>',
    footerNote: 'copied twice · carried',
  },
  twr_page_food_eat_slow: {
    extraClasses: 'twr-page twr-page--original',
    style: '--twr-page-tilt:-0.1deg',
    footerNote: 'found · carried · amended',
  },
  twr_page_food_unlabeled_can: {
    extraClasses: 'twr-page twr-page--relic',
    style: '--twr-page-tilt:0.34deg; --twr-wear-opacity:0.92',
    stamp: '<span class="twr-stamp">Relic page</span>',
    footerNote: 'found · carried · amended',
  },
  twr_page_shelter_wind_heat: {
    extraClasses: 'twr-page twr-page--original',
    style: '--twr-page-tilt:-0.14deg; --twr-stain-x:80%; --twr-stain-y:12%',
    footerNote: 'found · carried · amended',
  },
  twr_page_shelter_not_ground: {
    extraClasses: 'twr-page twr-page--original twr-page--people',
    style: '--twr-page-tilt:-0.06deg',
    footerNote: 'found · carried · amended',
  },
  twr_page_travel_mark_only_you: {
    extraClasses: 'twr-page twr-page--copied twr-page--travel',
    style: '--twr-page-tilt:-0.22deg; --twr-stain-x:74%; --twr-stain-y:18%',
    stamp: '<span class="twr-stamp is-copied">Copied twice</span>',
    bodyExtra:
      '<div class="twr-scrap twr-tape"><p class="twr-hand-rough">Three notches is too obvious. Use what bends, not what stacks.</p></div>',
    footerNote: 'private code · carried',
  },
  twr_page_mistakes_shortcut: {
    extraClasses: 'twr-page twr-page--correction twr-page--mistakes',
    style: '--twr-stain-x:18%; --twr-stain-y:72%; --twr-wear-opacity:0.94',
    bodyExtra:
      '<aside class="found-margin twr-margin-note is-warning"><span class="found-margin__label">Margin:</span> Shortcut = somebody else\'s old mistake.</aside>',
    footerNote: 'correction · carried',
  },
  twr_page_people_warmth_not_story: {
    extraClasses: 'twr-page twr-page--original twr-page--people',
    style: '--twr-card-tilt:-0.7deg',
    bodyExtra:
      '<div class="twr-locker-card" style="--twr-card-tilt:-0.7deg;"><p class="twr-hand-main">Give soup before names. Give fire before history.</p></div>',
    footerNote: 'found · carried · amended',
  },
  twr_page_signals_three_knocks: {
    extraClasses: 'twr-page twr-page--copied twr-page--signals',
    style: '--twr-stain-x:86%; --twr-stain-y:64%',
    stamp: '<span class="twr-stamp is-copied">Copied at relay cabin</span>',
    bodyExtra:
      '<p class="twr-copy-type">three knocks = come in<br>two knocks = wait<br>one knock = leave it outside</p><p class="twr-carrier-mark" style="--twr-mark-tilt:1.4deg;">Unless they knock too clean.</p>',
    footerNote: 'copied · tested in fog',
  },
};

function polishFile(filename) {
  const pageId = filename.replace('.html', '');
  const cfg = POLISH[pageId];
  if (!cfg) return { file: filename, skipped: true, reason: 'no config' };

  const path = join(PAGES_DIR, filename);
  let html = readFileSync(path, 'utf8');
  if (html.includes('twr-page ') && html.includes('twr-body')) {
    return { file: filename, skipped: true, reason: 'already polished' };
  }

  html = html.replace(
    /(<div class="fp found-page )(fp-type--[^"]+)([^"]*")/,
    `$1$2 ${cfg.extraClasses}$3`,
  );
  if (cfg.style) {
    html = html.replace(
      /data-twr-page-id="([^"]+)"/,
      `data-twr-page-id="$1" style="${cfg.style}"`,
    );
  }
  if (cfg.stamp) {
    html = html.replace(
      /(<header class="fp-head found-head">\s*<span class="fp-cat found-tab">[^<]+<\/span>)/,
      `$1\n    ${cfg.stamp}`,
    );
  }
  html = html.replace(
    '<div class="fp-body found-body">',
    '<div class="fp-body found-body twr-body">',
  );
  html = html.replace(
    /<aside class="found-margin">/g,
    '<aside class="found-margin twr-margin-note">',
  );
  if (cfg.bodyExtra) {
    html = html.replace('</div>\n  <footer class="fp-foot">', `${cfg.bodyExtra}\n  </div>\n  <footer class="fp-foot twr-page-footer">`);
  } else {
    html = html.replace('<footer class="fp-foot">', '<footer class="fp-foot twr-page-footer">');
  }
  const note = cfg.footerNote ?? 'found · carried · amended';
  html = html.replace(
    /<span class="fp-edition">[^<]+<\/span>/,
    `<span class="fp-edition">Found Copy No. 17 — Lake City / Kootenai</span><span class="twr-page-source">${note}</span>`,
  );

  writeFileSync(path, html.endsWith('\n') ? html : `${html}\n`, 'utf8');
  return { file: filename, polished: true };
}

const files = readdirSync(PAGES_DIR).filter((f) => f.startsWith('twr_page_') && f.endsWith('.html'));
const results = files.map(polishFile);
console.log(JSON.stringify({ ok: true, workOrder: 'TWR-POLISH-001', results }, null, 2));
