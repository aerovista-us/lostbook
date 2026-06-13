#!/usr/bin/env node
/**
 * TWR-DRAWN-ICON-PACK-001 — static HTML emoji → drawn icon replacement.
 * Use after icon pack is locked; not run automatically on every merge.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { replaceEmojiIconsInHtml } from '../assets/js/twr-icons.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES_DIR = join(__dirname, '../almanac/pages');

function walkHtml(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walkHtml(path));
    else if (name.endsWith('.html')) out.push(path);
  }
  return out;
}

const files = process.argv.includes('--twr-only')
  ? readdirSync(PAGES_DIR).filter((f) => f.startsWith('twr_page_') && f.endsWith('.html')).map((f) => join(PAGES_DIR, f))
  : walkHtml(PAGES_DIR);

const dryRun = process.argv.includes('--dry-run');
const results = [];

for (const path of files) {
  const before = readFileSync(path, 'utf8');
  const after = replaceEmojiIconsInHtml(before);
  if (after !== before) {
    if (!dryRun) writeFileSync(path, after.endsWith('\n') ? after : `${after}\n`, 'utf8');
    results.push({ file: path.replace(`${PAGES_DIR}/`, ''), changed: true });
  }
}

console.log(JSON.stringify({
  ok: true,
  workOrder: 'TWR-DRAWN-ICON-PACK-001',
  dryRun,
  changed: results.length,
  results,
}, null, 2));
