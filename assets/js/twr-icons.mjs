/**
 * TWR-DRAWN-ICON-PACK-001 — emoji → hand-drawn icon replacement for Lostbook reader.
 */

/** @type {Record<string, { className: string, alt: string, title: string }>} */
export const ICON_MAP = {
  '⛺': { className: 'twr-icon--camp', alt: 'Hand-drawn camp setup icon', title: 'Effective camp setup' },
  '🔥': { className: 'twr-icon--fire-lay', alt: 'Hand-drawn fire lay icon', title: 'Fire lay' },
  '💧': { className: 'twr-icon--water-filter', alt: 'Hand-drawn water filter icon', title: 'Water filter layers' },
  '🧭': { className: 'twr-icon--travel', alt: 'Hand-drawn compass icon', title: 'Direction and travel' },
  '🪨': { className: 'twr-icon--trail-mark', alt: 'Hand-drawn trail mark icon', title: 'Hidden trail mark' },
  '🚪': { className: 'twr-icon--knock-code', alt: 'Hand-drawn knock code icon', title: 'Knock code' },
  '⚠️': { className: 'twr-icon--warning', alt: 'Hand-drawn warning icon', title: 'Warning' },
  '⚠': { className: 'twr-icon--warning', alt: 'Hand-drawn warning icon', title: 'Warning' },
  '🤝': { className: 'twr-icon--trade-people', alt: 'Hand-drawn trade-first icon', title: 'Trade first' },
  '🪢': { className: 'twr-icon--knot', alt: 'Hand-drawn knot icon', title: 'Knot diagram' },
  '🪓': { className: 'twr-icon--tool-axe', alt: 'Hand-drawn axe icon', title: 'Tool / axe' },
  '🍲': { className: 'twr-icon--shared-warmth', alt: 'Hand-drawn shared warmth icon', title: 'Shared warmth' },
  '❌': { className: 'twr-icon--mistake', alt: 'Hand-drawn mistake icon', title: 'Do not repeat' },
  '🏠': { className: 'twr-icon--camp', alt: 'Hand-drawn shelter camp icon', title: 'Shelter / camp' },
  '🛤': { className: 'twr-icon--travel', alt: 'Hand-drawn travel icon', title: 'Travel / direction' },
  '📡': { className: 'twr-icon--knock-code', alt: 'Hand-drawn signals icon', title: 'Signals' },
  '👥': { className: 'twr-icon--trade-people', alt: 'Hand-drawn people trust icon', title: 'People / trust' },
};

const EMOJI_KEYS = Object.keys(ICON_MAP).sort((a, b) => b.length - a.length);

/**
 * @param {string} emoji
 * @param {{ tab?: boolean, sm?: boolean, lg?: boolean }} [opts]
 */
export function emojiToIconHtml(emoji, opts = {}) {
  const entry = ICON_MAP[emoji];
  if (!entry) return null;
  const sizes = [
    opts.tab ? 'twr-icon--tab' : '',
    opts.sm ? 'twr-icon--sm' : '',
    opts.lg ? 'twr-icon--lg' : '',
  ].filter(Boolean).join(' ');
  return `<span class="twr-icon ${entry.className}${sizes ? ` ${sizes}` : ''}" role="img" aria-label="${entry.alt}" title="${entry.title}"></span>`;
}

/**
 * Replace mapped emoji placeholders in page HTML at render time.
 * @param {string} html
 */
export function replaceEmojiIconsInHtml(html) {
  if (!html || typeof html !== 'string') return html;

  let out = html.replace(
    /(<span class="[^"]*(?:found-tab|fp-cat)[^"]*">)\s*([\u{1F300}-\u{1FAFF}\u26A0][\uFE0F\u20E3]?)\s*/gu,
    (match, open, emoji) => {
      const icon = emojiToIconHtml(emoji, { tab: true });
      return icon ? `${open}${icon} ` : match;
    },
  );

  for (const emoji of EMOJI_KEYS) {
    const icon = emojiToIconHtml(emoji);
    if (!icon) continue;
    const parts = out.split(emoji);
    if (parts.length === 1) continue;
    out = parts.join(icon);
  }

  return out;
}

/**
 * Apply drawn icon to a side-tab symbol element.
 * @param {HTMLElement} symEl
 * @param {string} symbol
 */
export function renderTabSymbol(symEl, symbol) {
  if (!symEl) return;
  const trimmed = String(symbol || '').trim();
  const icon = emojiToIconHtml(trimmed, { tab: true });
  if (icon) {
    symEl.innerHTML = icon;
    symEl.classList.add('twr-tab-symbol');
  } else {
    symEl.textContent = trimmed;
  }
}

/**
 * @param {ParentNode} root
 */
export function applyIconPackToDom(root) {
  if (!root) return;
  for (const tab of root.querySelectorAll('.found-tab, .fp-cat.found-tab')) {
    const text = tab.textContent || '';
    const m = text.match(/^([\u{1F300}-\u{1FAFF}\u26A0][\uFE0F\u20E3]?)\s*/u);
    if (!m) continue;
    const icon = emojiToIconHtml(m[1], { tab: true });
    if (icon) tab.innerHTML = `${icon} ${text.slice(m[0].length)}`;
  }
}
