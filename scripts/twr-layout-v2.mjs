#!/usr/bin/env node
/**
 * TWR-POLISH-002 — rebuild 12 TWR pages using canonical lostbook modular layout
 * + in-page relic card blocks (reference: signals_03, relic card grid).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '../almanac/pages');
const DATA_PATH = join(__dirname, '../../../services/artlocalized-api/data/twr/notebook-pages.json');

const TAB_EMOJI = {
  Water: '💧', Fire: '🔥', Food: '🍲', Shelter: '🏠', Travel: '🛤',
  Signals: '📡', People: '👥', Mistakes: '⚠️',
};

const PAGE_TYPE_CLASS = {
  original: 'fp-type--original',
  copied: 'fp-type--copied',
  margin: 'fp-type--margin',
  correction: 'fp-type--correction',
  relic: 'fp-type--relic',
};

const TWR_POLISH_BY_TAB = {
  Travel: 'twr-page--travel', People: 'twr-page--people',
  Mistakes: 'twr-page--mistakes', Signals: 'twr-page--signals',
};

const TWR_POLISH_BY_TYPE = {
  original: 'twr-page--original', copied: 'twr-page--copied',
  margin: 'twr-page--original', correction: 'twr-page--correction', relic: 'twr-page--relic',
};

const STAIN = {
  twr_page_water_melt_snow: 'fp-stain--water',
  twr_page_water_creek_tells: 'fp-stain--water',
  twr_page_fire_smoke_signature: 'fp-stain--burn',
  twr_page_fire_one_coal: 'fp-stain--burn',
  twr_page_food_eat_slow: 'fp-stain--smudge',
  twr_page_food_unlabeled_can: 'fp-stain--ring',
  twr_page_shelter_wind_heat: 'fp-stain--smudge',
  twr_page_shelter_not_ground: 'fp-stain--smudge',
  twr_page_travel_mark_only_you: 'fp-stain--smudge',
  twr_page_mistakes_shortcut: 'fp-stain--burn',
  twr_page_people_warmth_not_story: 'fp-stain--ring',
  twr_page_signals_three_knocks: 'fp-stain--smudge',
};

const CARD_NO = {
  twr_page_water_melt_snow: '01', twr_page_water_creek_tells: '02',
  twr_page_fire_smoke_signature: '03', twr_page_fire_one_coal: '04',
  twr_page_food_eat_slow: '05', twr_page_food_unlabeled_can: '06',
  twr_page_shelter_wind_heat: '07', twr_page_shelter_not_ground: '08',
  twr_page_travel_mark_only_you: '09', twr_page_mistakes_shortcut: '10',
  twr_page_people_warmth_not_story: '11', twr_page_signals_three_knocks: '12',
};

const TYPE_LABEL = {
  original: 'Field note', copied: 'Copied scrap', relic: 'Relic card',
  margin: 'Margin sheet', correction: 'Correction note',
};

const KICKER_SUFFIX = {
  original: 'original hand', copied: 'copied pamphlet scrap', relic: 'relic card',
  margin: 'margin', correction: 'correction',
};

const FOOTER_SOURCE = {
  twr_page_water_melt_snow: 'found · carried · amended',
  twr_page_water_creek_tells: 'found · mapped · carried',
  twr_page_fire_smoke_signature: 'field original · amended',
  twr_page_fire_one_coal: 'copied · edges burned',
  twr_page_food_eat_slow: 'trader note · carried',
  twr_page_food_unlabeled_can: 'relic · tested downwind',
  twr_page_shelter_wind_heat: 'field original · carried',
  twr_page_shelter_not_ground: 'margin · child hand',
  twr_page_travel_mark_only_you: 'private code · carried',
  twr_page_mistakes_shortcut: 'correction · red X on map',
  twr_page_people_warmth_not_story: 'trade knowledge · carried',
  twr_page_signals_three_knocks: 'copied · tested in fog',
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function kicker(tab, pageType, pageId) {
  const t = tab.toLowerCase();
  if (pageId === 'twr_page_signals_three_knocks') return `${t} · copied at relay cabin`;
  if (pageId === 'twr_page_travel_mark_only_you') return `${t} · private mark code`;
  return `${t} · ${KICKER_SUFFIX[pageType] ?? 'field note'}`;
}

function relicCard(pageId, content) {
  const no = CARD_NO[pageId] ?? '00';
  const title = content.relicLabel ? esc(content.relicLabel).toUpperCase() : esc(content.title).toUpperCase();
  const type = TYPE_LABEL[content.pageType] ?? 'Field note';
  const condition = content.pageType === 'copied' ? 'Edges worn, copied twice'
    : content.pageType === 'relic' ? 'Kept, handled often'
    : content.pageType === 'correction' ? 'Marked, crossed out route'
    : 'Carried, amended';
  const foundWith = content.locationHint ? esc(content.locationHint) : 'Unknown camp';

  let inner = '';
  if (content.survivalUse) {
    inner += `<p class="twr-relic-card__use"><strong>Use:</strong> ${esc(content.survivalUse)}</p>`;
  }
  if (content.emotionalUse) {
    inner += `<p class="twr-relic-card__meaning"><em>${esc(content.emotionalUse)}</em></p>`;
  }

  return `<div class="twr-relic-card">
  <div class="twr-relic-card__head">
    <span class="twr-relic-card__label">Relic card</span>
    <span class="twr-relic-card__no">No. ${no}</span>
  </div>
  <h2 class="twr-relic-card__title">${title}</h2>
  <dl class="twr-relic-card__meta">
    <div><dt>Type</dt><dd>${esc(type)}</dd></div>
    <div><dt>Condition</dt><dd>${esc(condition)}</dd></div>
    <div><dt>Found with</dt><dd>${foundWith}</dd></div>
  </dl>
  ${inner}
</div>`;
}

function marginBlock(notes, label = 'Pencil note') {
  if (!notes?.length) return '';
  return `<aside class="found-margin">
  <span class="found-margin__label">${label}:</span>
  ${notes.map(esc).join(' · ')}
</aside>`;
}

function splitBody(body) {
  const parts = String(body).split(/\n\n+/).filter(Boolean);
  let source = '';
  let rest = parts;
  if (parts[0]?.toLowerCase().startsWith('copied')) {
    source = parts[0];
    rest = parts.slice(1);
  }
  return { source, paragraphs: rest };
}

function extraBlocks(pageId, content) {
  const blocks = [];

  if (pageId === 'twr_page_signals_three_knocks') {
    blocks.push(`<div class="found-symbol-grid">
  <div><span class="found-symbol">1</span><p><strong>One knock</strong><br />Who is there.</p></div>
  <div><span class="found-symbol">2</span><p><strong>Two knocks</strong><br />Friend — wait.</p></div>
  <div><span class="found-symbol">3</span><p><strong>Three knocks</strong><br />Come in. Fire is on.</p></div>
  <div><span class="found-symbol">4+</span><p><strong>More than three</strong><br />Trouble. Stay quiet or bring help.</p></div>
</div>`);
    blocks.push('<div class="found-taped-note"><strong>Unless they knock too clean.</strong> A perfect pattern from a stranger is a trap dressed as courtesy.</div>');
  }

  if (pageId === 'twr_page_travel_mark_only_you') {
    blocks.push(`<div class="found-symbol-grid">
  <div><span class="found-symbol">⌐</span><p><strong>Left fork notch</strong><br />Water this way.</p></div>
  <div><span class="found-symbol">⌐⌐</span><p><strong>Right fork notch</strong><br />Shelter this way.</p></div>
  <div><span class="found-symbol">×</span><p><strong>Cross notch</strong><br />Turn back.</p></div>
  <div><span class="found-symbol">···</span><p><strong>Three dots</strong><br />Someone checked twice.</p></div>
</div>`);
    blocks.push('<div class="found-taped-note"><strong>Three notches is too obvious.</strong> Use what bends, not what stacks.</div>');
  }

  if (pageId === 'twr_page_food_unlabeled_can') {
    blocks.push(`<ul class="twr-relic-checklist">
  <li><span class="twr-check">☐</span> Shake test — no slosh</li>
  <li><span class="twr-check">☐</span> Smell at seam — sweet-metal, not rot</li>
  <li><span class="twr-check">☐</span> Open downwind</li>
  <li><span class="twr-check">☐</span> Spoon, not gulp</li>
</ul>`);
  }

  if (pageId === 'twr_page_fire_one_coal') {
    blocks.push('<div class="found-taped-note"><strong>Walk slow. Breathe away from it.</strong> A live coal is lighter than gathering kindling in the dark.</div>');
  }

  if (pageId === 'twr_page_people_warmth_not_story') {
    blocks.push('<div class="found-taped-note"><strong>Offer tea. Offer dry socks.</strong> Do not offer your route, your cache, or the names of people waiting for you.</div>');
  }

  if (pageId === 'twr_page_mistakes_shortcut') {
    blocks.push('<p class="found-crossout"><span class="found-ruled">The cut looked dry on the map.</span> — take the long bend east.</p>');
  }

  if (pageId === 'twr_page_shelter_not_ground') {
    blocks.push('<aside class="local-note"><span class="local-note__label">Child note:</span> I slept on her coat once. Woke with frost on my side but not on my chest.</aside>');
  }

  if (pageId === 'twr_page_water_melt_snow') {
    blocks.push('<div class="found-taped-note"><strong>Left scratch on the handle</strong> means boil twice. The first cup takes the road dust.</div>');
  }

  return blocks.join('\n');
}

function buildPage(row) {
  const { pageId, content } = row;
  const tab = content.tab;
  const emoji = TAB_EMOJI[tab] ?? '📓';
  const pageType = content.pageType ?? 'original';
  const typeClass = PAGE_TYPE_CLASS[pageType] ?? 'fp-type--original';
  const polish = ['twr-page', TWR_POLISH_BY_TYPE[pageType], TWR_POLISH_BY_TAB[tab]].filter(Boolean).join(' ');
  const stain = STAIN[pageId] ?? 'fp-stain--smudge';
  const { source, paragraphs } = splitBody(content.body);
  const tape = pageType === 'copied' ? '  <div class="fp-tape fp-tape--tl"></div>\n' : '';

  const bodyHtml = paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br />')}</p>`).join('\n');
  const sourceHtml = source ? `<p class="found-source">${esc(source)}</p>\n` : '';
  const marginLabel = pageType === 'margin' ? 'Later hand' : 'Pencil note';

  return `<div class="fp found-page ${typeClass} ${polish}" data-twr-page-id="${esc(pageId)}">
  <div class="fp-page-wear fp-page-wear--tl"></div><div class="fp-page-wear fp-page-wear--br"></div>
${tape}  <span class="twr-field-mark" aria-hidden="true">TWR · v1</span>
  <div class="fp-stain ${stain}"></div>
  <header class="fp-head found-head">
    <span class="fp-cat found-tab">${emoji} ${esc(tab)}</span>
    <h1 class="fp-title found-title">${esc(content.title)}</h1>
  </header>
  <div class="fp-body found-body">
    <p class="found-kicker">${esc(kicker(tab, pageType, pageId))}</p>
${sourceHtml}${bodyHtml}
${extraBlocks(pageId, content)}
${marginBlock(content.marginNotes, marginLabel)}
${relicCard(pageId, content)}
    <p class="found-sign">— ${esc(content.voice ?? 'unknown carrier')}</p>
  </div>
  <footer class="fp-foot twr-page-footer"><span>TWR v1</span><span class="fp-edition">Found Copy No. 17 — Lake City / Kootenai</span><span class="twr-page-source">${esc(FOOTER_SOURCE[pageId] ?? 'found · carried')}</span></footer>
</div>
`;
}

const rows = JSON.parse(readFileSync(DATA_PATH, 'utf8'))
  .filter((r) => r.publishing?.sourceStatus === 'publishable' && String(r.pageId).startsWith('twr_page_'));

const results = [];
for (const row of rows) {
  const filename = `${row.pageId}.html`;
  const html = buildPage(row);
  writeFileSync(join(PAGES_DIR, filename), html.endsWith('\n') ? html : `${html}\n`, 'utf8');
  results.push({ file: filename, pageId: row.pageId });
}

console.log(JSON.stringify({ ok: true, workOrder: 'TWR-POLISH-002', count: results.length, results }, null, 2));
