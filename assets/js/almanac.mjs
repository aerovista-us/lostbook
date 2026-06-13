/**
 * Things Worth Remembering — found notebook (StPageFlip).
 * HTML leaves from almanac-manifest.json (built by tools/build_almanac.py).
 */

import { replaceEmojiIconsInHtml, renderTabSymbol } from "./twr-icons.mjs";

const PAGE_FLIP_VENDOR = new URL("../vendor/page-flip.browser.min.js", import.meta.url).href;
const PAGE_FLIP_CDN =
  "https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js";

const CONFIG = {
  swipeDistance: 24,
  flippingTime: 1000,
  flippingTimeReducedMotion: 220,
  maxShadowOpacity: 0.68,
  manifest: "almanac-manifest.json",
};

/**
 * Fill the viewport while keeping each page slightly wider than tall (see --alm-page-aspect).
 * Case chrome estimates — refined from DOM when shell exists.
 */
const VIEW = {
  deskPad: 12,
  casePadX: 38,
  casePadY: 24,
  shellInsetX: 34,
  shellInsetY: 20,
  chromeEstimate: 92,
  pageAspectFallback: 0.72,
  pageAspectMin: 0.52,
  pageAspectMax: 0.92,
  pageMinWidthSingle: 200,
  pageMinWidthSpread: 240,
  pageMinHeight: 200,
  pageMaxWidthSpread: 680,
  deskPadSingle: 0,
  casePadSingleX: 0,
  casePadSingleY: 0,
  shellInsetSingleX: 0,
  shellInsetSingleY: 0,
  resizeDebounceMs: 150,
  orientationDebounceMs: 400,
  preloadConcurrency: 24,
  priorityPageCount: 12,
  chromeIdleMs: 2800,
};

let pageFlipInstance = null;

function injectScriptSrc(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });
}

async function injectScriptFromUrl(sourceUrl) {
  const res = await fetch(sourceUrl, { cache: "force-cache", credentials: "omit" });
  if (!res.ok) throw new Error(`${sourceUrl} → HTTP ${res.status}`);
  const text = await res.text();
  const blob = new Blob([text], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  try {
    await injectScriptSrc(blobUrl);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function ensurePageFlip(preferLocalVendor) {
  if (globalThis.St?.PageFlip) return;
  const sources = preferLocalVendor
    ? [PAGE_FLIP_VENDOR, PAGE_FLIP_CDN]
    : [PAGE_FLIP_CDN, PAGE_FLIP_VENDOR];
  let lastErr = null;
  for (const url of sources) {
    try {
      await injectScriptFromUrl(url);
      if (globalThis.St?.PageFlip) return;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("page-flip library did not register global St.PageFlip");
}

function measureViewport() {
  const vv = window.visualViewport;
  return {
    w: Math.round(vv?.width ?? window.innerWidth),
    h: Math.round(vv?.height ?? window.innerHeight),
  };
}

function readPageAspect() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--alm-page-aspect")
    .trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return VIEW.pageAspectFallback;
  return Math.min(VIEW.pageAspectMax, Math.max(VIEW.pageAspectMin, n));
}

function measureChromeHeight() {
  /* Chrome floats over the page in immersive mode — do not shrink the book. */
  if (document.body.classList.contains("almanac-immersive")) return 0;
  const shell = document.getElementById("almanac-shell");
  if (!shell) return VIEW.chromeEstimate;
  const top = shell.querySelector(".alm-top");
  const foot = shell.querySelector(".alm-foot");
  const h = (top?.getBoundingClientRect().height ?? 0) +
    (foot?.getBoundingClientRect().height ?? 0) + 6;
  return h > 40 ? Math.round(h) : VIEW.chromeEstimate;
}

/** Enough width for two readable pages (landscape phone, tablet, desktop). */
function wantsSpreadLayout(viewportW, viewportH) {
  const aspect = readPageAspect();
  const needW =
    VIEW.pageMinWidthSpread * 2 +
    VIEW.casePadX +
    VIEW.shellInsetX +
    VIEW.deskPad * 2 +
    16;
  const needH =
    VIEW.pageMinHeight + VIEW.casePadY + VIEW.shellInsetY + VIEW.chromeEstimate + VIEW.deskPad * 2;
  return viewportW >= needW && viewportH >= needH;
}

/**
 * Size the case + pages to fill the viewport.
 * --alm-page-aspect = width ÷ height (portrait). Each page must satisfy 2×width > height (aspect > 0.5).
 */
function layoutInsets(spread) {
  if (document.body.classList.contains("almanac-immersive")) {
    return {
      deskPad: 0,
      casePadX: 0,
      casePadY: 0,
      shellInsetX: 0,
      shellInsetY: 0,
    };
  }
  if (!spread) {
    return {
      deskPad: VIEW.deskPadSingle,
      casePadX: VIEW.casePadSingleX,
      casePadY: VIEW.casePadSingleY,
      shellInsetX: VIEW.shellInsetSingleX,
      shellInsetY: VIEW.shellInsetSingleY,
    };
  }
  return {
    deskPad: VIEW.deskPad,
    casePadX: VIEW.casePadX,
    casePadY: VIEW.casePadY,
    shellInsetX: VIEW.shellInsetX,
    shellInsetY: VIEW.shellInsetY,
  };
}

function computeBookLayout(viewportW, viewportH, spread) {
  const aspect = readPageAspect();
  const chromeH = measureChromeHeight();
  const insets = layoutInsets(spread);
  const pad = insets.deskPad * 2;
  const availW = viewportW - pad;
  const availH = viewportH - pad;

  let caseW;
  let caseH;
  let pageW;
  let pageH;

  if (!spread) {
    caseW = availW;
    caseH = availH;
    const bookAreaW = caseW - insets.casePadX - insets.shellInsetX;
    const bookAreaH = caseH - insets.casePadY - insets.shellInsetY - chromeH;

    /* Height-first: maximize vertical use of the screen. */
    pageH = bookAreaH;
    pageW = Math.floor(pageH * aspect);
    if (pageW > bookAreaW) {
      pageW = bookAreaW;
      pageH = Math.floor(pageW / aspect);
    }
    pageW = Math.max(VIEW.pageMinWidthSingle, Math.floor(pageW));
    pageH = Math.max(VIEW.pageMinHeight, Math.floor(pageH));
  } else {
    caseW = availW;
    caseH = availH;
    const bookAreaW = caseW - insets.casePadX - insets.shellInsetX;
    const bookAreaH = caseH - insets.casePadY - insets.shellInsetY - chromeH;

    pageH = bookAreaH;
    pageW = pageH * aspect;
    if (pageW * 2 > bookAreaW) {
      pageW = bookAreaW / 2;
      pageH = pageW / aspect;
    }
    pageW = Math.min(
      VIEW.pageMaxWidthSpread,
      Math.max(VIEW.pageMinWidthSpread, Math.floor(pageW)),
    );
    pageH = Math.max(VIEW.pageMinHeight, Math.floor(pageH));
    pageW = Math.min(pageW, Math.floor(pageH * aspect));
  }

  return {
    spread,
    pageWidth: pageW,
    pageHeight: pageH,
    usePortrait: !spread,
    caseWidth: caseW,
    caseHeight: caseH,
    aspect,
  };
}

function applyShellLayout(layout) {
  document.body.classList.toggle("almanac-spread", layout.spread);
  document.body.classList.toggle("almanac-fill", !layout.spread);
  const caseEl = document.getElementById("almanac-case");
  if (!caseEl) return;
  caseEl.dataset.layout = layout.spread ? "spread" : "single";
  caseEl.style.setProperty("--alm-case-width", `${layout.caseWidth}px`);
  caseEl.style.setProperty("--alm-case-height", `${layout.caseHeight}px`);
}

function pageDimsFromLayout(layout) {
  return {
    pageWidth: layout.pageWidth,
    pageHeight: layout.pageHeight,
    usePortrait: layout.usePortrait,
  };
}

function layoutDimsKey(dims) {
  return `${dims.pageWidth}x${dims.pageHeight}x${dims.usePortrait ? 1 : 0}`;
}

/** Edge defers lazy imgs inside flip pages → black placeholders; force eager. */
function wirePageImages(root, onImageReady) {
  if (!root) return;
  for (const img of root.querySelectorAll("img")) {
    img.loading = "eager";
    img.decoding = "async";
    if (img.complete) continue;
    img.addEventListener(
      "load",
      () => {
        onImageReady?.();
      },
      { once: true, passive: true },
    );
    img.addEventListener(
      "error",
      () => {
        onImageReady?.();
      },
      { once: true, passive: true },
    );
  }
}

function resolvePageUrl(relative) {
  return new URL(relative, window.location.href).href;
}

function safeHref(href) {
  if (typeof href !== "string") return null;
  const t = href.trim();
  if (!t || /^\s*javascript:/i.test(t) || /^\s*data:/i.test(t)) return null;
  try {
    const u = new URL(t, window.location.href);
    if (u.protocol === "javascript:" || u.protocol === "data:") return null;
    return u.href;
  } catch {
    return null;
  }
}

function parseLinks(links) {
  if (!Array.isArray(links)) return [];
  const out = [];
  for (const l of links) {
    if (!l || typeof l !== "object") continue;
    const label = typeof l.label === "string" ? l.label.trim() : "";
    const href = safeHref(typeof l.href === "string" ? l.href : "");
    if (!label || !href) continue;
    out.push({ label, href });
  }
  return out;
}

function collectChromeRefs() {
  return {
    meta: document.getElementById("alm-meta"),
    spread: document.getElementById("alm-spread"),
    footer: document.getElementById("alm-footer"),
    chinToggle: document.getElementById("alm-chin-toggle"),
    chinSummary: document.getElementById("alm-chin-summary"),
    chinHint: document.getElementById("alm-chin-hint"),
    chinNote: document.getElementById("alm-chin-note"),
    chinLinks: document.getElementById("alm-chin-links"),
    edition: "Things Worth Remembering",
  };
}

function applyShellLabels(manifest, chrome) {
  if (!chrome) return;
  if (typeof manifest.title === "string" && manifest.title.trim()) {
    chrome.edition = manifest.title.trim();
  }
  if (chrome.meta) chrome.meta.textContent = chrome.edition;
}

function setChinOpen(chrome, open) {
  if (!chrome?.footer || !chrome?.chinToggle) return;
  chrome.footer.classList.toggle("chin-open", open);
  chrome.chinToggle.setAttribute("aria-expanded", open ? "true" : "false");
  document.body.classList.toggle("almanac-chrome-visible", open);
}

function titleForSpec(spec, idx) {
  if (!spec) return `Page ${idx + 1}`;
  return spec.kind === "placeholder"
    ? spec.title || spec.label
    : spec.title || `Page ${idx + 1}`;
}

function makeSyncChrome(pageSpecs, chrome) {
  let lastIdx = -1;
  let twoPageOpen = false;
  return (idx, opts = {}) => {
    const collapseOnPageChange = opts.collapseOnPageChange !== false;
    if (collapseOnPageChange && lastIdx >= 0 && idx !== lastIdx) {
      setChinOpen(chrome, false);
    }
    lastIdx = idx;
    if (typeof opts.twoPageOpen === "boolean") twoPageOpen = opts.twoPageOpen;

    const spec = pageSpecs[idx];
    const n = pageSpecs.length;
    const spreadTitle = titleForSpec(spec, idx);

    let spreadLabel = spreadTitle;
    if (twoPageOpen && idx < n - 1) {
      const right = titleForSpec(pageSpecs[idx + 1], idx + 1);
      spreadLabel = `${spreadTitle} · ${right}`;
    }

    if (chrome.meta) {
      chrome.meta.textContent = twoPageOpen
        ? `${chrome.edition} · ${idx + 1}–${Math.min(idx + 2, n)} / ${n}`
        : `${chrome.edition} · ${idx + 1} / ${n}`;
    }
    if (chrome.spread) chrome.spread.textContent = spreadLabel;
    if (chrome.chinSummary) chrome.chinSummary.textContent = spreadTitle;

    const open = chrome.footer?.classList.contains("chin-open");
    if (chrome.chinHint) {
      chrome.chinHint.textContent = open
        ? "Tap to collapse"
        : spec.category
          ? `${spec.category} · swipe corners`
          : "Swipe or tap corners to turn";
    }

    const note =
      spec.kind === "placeholder"
        ? spec.note || "This spread is not published yet."
        : spec.note || "";

    if (chrome.chinNote) {
      chrome.chinNote.textContent = note || "";
      chrome.chinNote.hidden = !note;
    }

    if (chrome.chinLinks) {
      chrome.chinLinks.replaceChildren();
      for (const l of spec.links || []) {
        const a = document.createElement("a");
        a.href = l.href;
        a.textContent = l.label;
        a.rel = "noopener noreferrer";
        chrome.chinLinks.appendChild(a);
      }
    }
  };
}

/**
 * Manifest page: string path, { html }, { src } image, { placeholder }, or { cover: true, html }.
 */
function normalizePageSpecs(manifest) {
  const raw = Array.isArray(manifest.pages) ? manifest.pages : [];
  return raw.map((entry, i) => {
    if (typeof entry === "string") {
      return {
        kind: "html",
        src: entry,
        resolved: resolvePageUrl(entry),
        title: entry.split("/").pop()?.replace(/\.html$/, "") || `Page ${i + 1}`,
        note: "",
        links: [],
        category: "",
        cover: false,
        htmlCached: null,
      };
    }
    if (!entry || typeof entry !== "object") {
      throw new Error(`almanac-manifest.json: invalid page at index ${i}`);
    }
    if (entry.placeholder === true) {
      const label =
        typeof entry.label === "string" && entry.label.trim()
          ? entry.label.trim()
          : `Page ${i + 1}`;
      return {
        kind: "placeholder",
        label,
        title: typeof entry.title === "string" && entry.title.trim() ? entry.title.trim() : label,
        note: typeof entry.note === "string" ? entry.note.trim() : "",
        links: parseLinks(entry.links),
        category: typeof entry.category === "string" ? entry.category : "",
        cover: false,
      };
    }
    if (typeof entry.html === "string") {
      const src = entry.html;
      return {
        kind: "html",
        src,
        resolved: resolvePageUrl(src),
        title:
          typeof entry.title === "string" && entry.title.trim()
            ? entry.title.trim()
            : src.split("/").pop()?.replace(/\.html$/, "") || `Page ${i + 1}`,
        note: typeof entry.note === "string" ? entry.note.trim() : "",
        links: parseLinks(entry.links),
        category: typeof entry.category === "string" ? entry.category : "",
        cover: entry.cover === true,
        htmlCached: null,
      };
    }
    throw new Error(`almanac-manifest.json: page ${i} needs "html" or "placeholder"`);
  });
}

async function loadHtmlContent(spec) {
  if (spec.htmlCached != null) return spec.htmlCached;
  const res = await fetch(spec.resolved, { cache: "force-cache" });
  if (!res.ok) throw new Error(`${spec.src} → HTTP ${res.status}`);
  spec.htmlCached = replaceEmojiIconsInHtml(await res.text());
  return spec.htmlCached;
}

async function preloadSpecsParallel(specs) {
  const pending = specs.filter((s) => s?.kind === "html" && s.htmlCached == null);
  const concurrency = VIEW.preloadConcurrency;
  for (let i = 0; i < pending.length; i += concurrency) {
    const batch = pending.slice(i, i + concurrency);
    await Promise.all(
      batch.map((s) =>
        loadHtmlContent(s).catch(() => {
          s.htmlCached = `<div class="fp"><p>Could not load page.</p></div>`;
        }),
      ),
    );
  }
}

async function preloadPriorityPages(pageSpecs) {
  const n = Math.min(VIEW.priorityPageCount, pageSpecs.length);
  const batch = [];
  for (let i = 0; i < n; i++) {
    if (pageSpecs[i]?.kind === "html") batch.push(pageSpecs[i]);
  }
  await Promise.all(
    batch.map((s) =>
      loadHtmlContent(s).catch(() => {
        s.htmlCached = `<div class="fp"><p>Could not load page.</p></div>`;
      }),
    ),
  );
}

function preloadAllPageHtmlBackground(pageSpecs) {
  void preloadSpecsParallel(pageSpecs.filter((s) => s.kind === "html"));
}

function createPageElement(spec) {
  const page = document.createElement("div");
  page.className = "page";
  page.dataset.density = spec.cover ? "hard" : "soft";
  if (spec.cover) page.classList.add("page--cover");

  if (spec.kind === "placeholder") {
    page.classList.add("page--placeholder");
    const inner = document.createElement("div");
    inner.className = "page__placeholder-inner";
    inner.textContent = spec.title || spec.label;
    page.appendChild(inner);
  } else if (spec.kind === "html") {
    const wrap = document.createElement("div");
    wrap.className = "page__notes";
    if (spec.htmlCached != null) {
      wrap.innerHTML = spec.htmlCached;
    } else {
      wrap.innerHTML = `<div class="fp"><p>Page not loaded.</p></div>`;
    }
    page.appendChild(wrap);
  }
  return page;
}

/** Templates for fast remount after rotate (no refetch). */
let pageTemplateCache = null;
let lastBookPageIndex = 0;

function clearPageTemplateCache() {
  pageTemplateCache = null;
}

function cachePageTemplates(pages) {
  pageTemplateCache = pages.map((p) => p.cloneNode(true));
}

function buildPagesFromTemplates() {
  const frag = document.createDocumentFragment();
  const pages = pageTemplateCache.map((tpl) => {
    const clone = tpl.cloneNode(true);
    frag.appendChild(clone);
    return clone;
  });
  return { frag, pages };
}

function showEmpty(bookEl, message) {
  bookEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  wrap.innerHTML = message;
  bookEl.appendChild(wrap);
}

async function buildPageElements(pageSpecs, { useTemplateCache = false, refreshCache = false } = {}) {
  if (refreshCache) clearPageTemplateCache();

  if (useTemplateCache && pageTemplateCache?.length === pageSpecs.length) {
    return buildPagesFromTemplates();
  }

  await preloadSpecsParallel(pageSpecs);

  const frag = document.createDocumentFragment();
  const pages = [];

  for (let i = 0; i < pageSpecs.length; i++) {
    const page = createPageElement(pageSpecs[i]);
    frag.appendChild(page);
    pages.push(page);
  }

  if (refreshCache || !pageTemplateCache) cachePageTemplates(pages);
  return { frag, pages };
}

function initChromeAutoHide(chrome) {
  let hideTimer = 0;
  const hotspots = [
    document.getElementById("alm-hotspot-top"),
    document.getElementById("alm-hotspot-bottom"),
  ].filter(Boolean);

  const scheduleHide = () => {
    window.clearTimeout(hideTimer);
    if (chrome?.footer?.classList.contains("chin-open")) return;
    hideTimer = window.setTimeout(() => {
      if (!chrome?.footer?.classList.contains("chin-open")) {
        document.body.classList.remove("almanac-chrome-visible");
      }
    }, VIEW.chromeIdleMs);
  };

  const show = () => {
    document.body.classList.add("almanac-chrome-visible");
    scheduleHide();
  };

  const keepVisibleTargets = [
    ...hotspots,
    document.getElementById("alm-top-bar"),
    chrome?.footer,
  ].filter(Boolean);

  for (const el of hotspots) {
    el.addEventListener("pointerdown", show, { passive: true });
    el.addEventListener("focus", show);
  }

  for (const el of keepVisibleTargets) {
    el.addEventListener("pointerenter", show, { passive: true });
  }

  if (chrome?.footer) {
    chrome.footer.addEventListener(
      "transitionend",
      () => {
        if (chrome.footer.classList.contains("chin-open")) {
          document.body.classList.add("almanac-chrome-visible");
          window.clearTimeout(hideTimer);
        }
      },
      { passive: true },
    );
  }

  document.body.classList.remove("almanac-chrome-visible");
  return { show };
}

function waitForViewportStable(maxMs = 900) {
  return new Promise((resolve) => {
    let last = measureViewport();
    let stableFrames = 0;
    const start = Date.now();

    const tick = () => {
      const vp = measureViewport();
      if (vp.w === last.w && vp.h === last.h) stableFrames += 1;
      else {
        stableFrames = 0;
        last = vp;
      }
      if (stableFrames >= 3 || Date.now() - start >= maxMs) {
        resolve(vp);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

function syncNav(pf, prevBtn, nextBtn) {
  if (!pf) return;
  const i = pf.getCurrentPageIndex();
  const n = pf.getPageCount();
  prevBtn.hidden = i <= 0;
  nextBtn.hidden = i >= n - 1;
}

function waitLayout(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}

function destroyPageFlip(pf) {
  if (!pf) return;
  try {
    if (typeof pf.destroy === "function") pf.destroy();
  } catch {
    /* ignore teardown errors */
  }
}

function buildPageFlipOptions(dims, flippingTime, hasCover, startPage) {
  const { pageWidth, pageHeight, usePortrait } = dims;
  return {
    width: pageWidth,
    height: pageHeight,
    size: "fixed",
    minWidth: pageWidth,
    maxWidth: pageWidth,
    minHeight: pageHeight,
    maxHeight: pageHeight,
    drawShadow: true,
    flippingTime,
    maxShadowOpacity: CONFIG.maxShadowOpacity,
    usePortrait,
    autoSize: false,
    mobileScrollSupport: true,
    swipeDistance: CONFIG.swipeDistance,
    showCover: hasCover,
    showPageCorners: true,
    clickEventForward: false,
    useMouseEvents: true,
    startPage,
    startZIndex: 0,
  };
}

function goToPageIndex(pf, target) {
  if (!pf || target < 0) return;
  const n = pf.getPageCount();
  const page = Math.max(0, Math.min(target, n - 1));
  if (page === pf.getCurrentPageIndex()) return;

  if (typeof pf.turnToPage === "function") {
    pf.turnToPage(page);
    return;
  }
  if (typeof pf.flip === "function") {
    pf.flip(page, "top");
    return;
  }
  const corner = "top";
  let guard = 0;
  while (pf.getCurrentPageIndex() < page && guard++ < n + 5) pf.flipNext(corner);
  guard = 0;
  while (pf.getCurrentPageIndex() > page && guard++ < n + 5) pf.flipPrev(corner);
}

function initSideTabs(tabs, getPageFlip, onAfterJump) {
  const nav = document.getElementById("alm-side-tabs");
  if (!nav || !tabs?.length) return { updateActive: () => {} };

  nav.replaceChildren();
  const sorted = [...tabs].sort((a, b) => a.pageIndex - b.pageIndex);

  sorted.forEach((tab, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const tape = tab.tape || "duct";
    const side = tab.side || "right";
    btn.className = `alm-tape-tab alm-tape-tab--${tape} alm-tape-tab--${side}`;
    btn.dataset.pageIndex = String(tab.pageIndex);
    btn.setAttribute("aria-label", tab.feel ? `${tab.label}: ${tab.feel}` : tab.label);
    btn.title = tab.feel ? `${tab.label} — ${tab.feel}` : tab.label;

    const sym = document.createElement("span");
    sym.className = "alm-tape-tab__sym";
    renderTabSymbol(sym, tab.symbol || "");
    sym.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "alm-tape-tab__label";
    label.textContent = tab.label || tab.id;

    btn.append(sym, label);

    const pct = sorted.length === 1 ? 50 : 12 + (i / (sorted.length - 1)) * 76;
    btn.style.top = `${pct}%`;

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pf = getPageFlip();
      goToPageIndex(pf, tab.pageIndex);
      onAfterJump?.(tab.pageIndex);
    });

    nav.appendChild(btn);
  });

  function updateActive(currentIndex) {
    let active = sorted[0];
    for (const tab of sorted) {
      if (tab.pageIndex <= currentIndex) active = tab;
      else break;
    }
    for (const btn of nav.querySelectorAll(".alm-tape-tab")) {
      const isActive = Number(btn.dataset.pageIndex) === active?.pageIndex;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-current", isActive ? "true" : "false");
    }
  }

  return { updateActive };
}

function initMagazine(PageFlip, bookEl, prevBtn, nextBtn, pageSpecs, chrome, bookTabs = []) {
  const syncChrome = chrome ? makeSyncChrome(pageSpecs, chrome) : null;
  const hasCover =
    pageSpecs.length > 0 &&
    (pageSpecs[0].cover === true || pageSpecs[pageSpecs.length - 1]?.cover === true);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flippingTime = reduceMotion ? CONFIG.flippingTimeReducedMotion : CONFIG.flippingTime;

  let pf = null;
  let layoutMode = null;
  let lastDimsKey = null;
  let relayouting = false;
  let suppressRelayoutUntil = 0;
  let resizeT = 0;
  let navBound = false;
  let keyBound = false;
  let chinBound = false;
  let sideTabsApi = null;

  const syncAll = (idx, opts = {}) => {
    syncNav(pf, prevBtn, nextBtn);
    sideTabsApi?.updateActive(idx);
    if (syncChrome) {
      syncChrome(idx, {
        ...opts,
        twoPageOpen: layoutMode === "spread",
      });
    }
  };

  async function mountAtPage(startPage = 0, { fromResize = false, forceFreshPages = false } = {}) {
    const wasReady = document.body.classList.contains("almanac-ready");
    if (fromResize) document.body.classList.add("almanac-resizing");

    if (fromResize) await waitForViewportStable();

    const vp = measureViewport();
    if (vp.w < 120 || vp.h < 120) {
      document.body.classList.remove("almanac-resizing");
      throw new Error(`Viewport too small (${vp.w}×${vp.h})`);
    }

    const spread = wantsSpreadLayout(vp.w, vp.h);
    let layout = computeBookLayout(vp.w, vp.h, spread);
    applyShellLayout(layout);
    layoutMode = spread ? "spread" : "single";

    await new Promise((resolve) => waitLayout(resolve));

    const vp2 = measureViewport();
    const spread2 = wantsSpreadLayout(vp2.w, vp2.h);
    if (spread2 === spread) {
      layout = computeBookLayout(vp2.w, vp2.h, spread);
      applyShellLayout(layout);
      await new Promise((resolve) => waitLayout(resolve));
    }

    let dims = pageDimsFromLayout(layout);
    if (dims.pageWidth < 80 || dims.pageHeight < 80) {
      document.body.classList.remove("almanac-resizing");
      throw new Error(`Page dimensions invalid (${dims.pageWidth}×${dims.pageHeight})`);
    }
    lastDimsKey = layoutDimsKey(dims);

    const useCache = fromResize && !forceFreshPages && pageTemplateCache != null;
    let { frag, pages } = await buildPageElements(pageSpecs, {
      useTemplateCache: useCache,
      refreshCache: forceFreshPages,
    });

    const prevPf = pf;
    destroyPageFlip(prevPf);
    pf = null;
    pageFlipInstance = null;
    bookEl.replaceChildren();
    bookEl.appendChild(frag);

    const safeStart = Math.max(0, Math.min(startPage, pageSpecs.length - 1));
    let flipOpts = buildPageFlipOptions(dims, flippingTime, hasCover, safeStart);
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, 80 + attempt * 60));
          await new Promise((resolve) => waitLayout(resolve));
          const vpR = measureViewport();
          layout = computeBookLayout(vpR.w, vpR.h, wantsSpreadLayout(vpR.w, vpR.h));
          applyShellLayout(layout);
          dims = pageDimsFromLayout(layout);
          lastDimsKey = layoutDimsKey(dims);
          flipOpts = buildPageFlipOptions(dims, flippingTime, hasCover, safeStart);
        }
        if (attempt === 2 && fromResize) {
          clearPageTemplateCache();
          bookEl.replaceChildren();
          ({ frag, pages } = await buildPageElements(pageSpecs, {
            useTemplateCache: false,
            refreshCache: true,
          }));
          bookEl.appendChild(frag);
        }
        pf = new PageFlip(bookEl, flipOpts);
        pf.loadFromHTML(pages);
        pageFlipInstance = pf;
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err;
        destroyPageFlip(pf);
        pf = null;
        pageFlipInstance = null;
      }
    }
    if (lastErr) {
      console.error("PageFlip init failed", lastErr);
      document.body.classList.remove("almanac-resizing");
      throw lastErr;
    }

    const scheduleReflow = () => {
      const ui = pf?.getUI?.();
      if (ui && typeof ui.update === "function") ui.update();
    };
    wirePageImages(bookEl, scheduleReflow);

    if (!wasReady) {
      document.body.classList.remove("almanac-loading");
      document.body.classList.add("almanac-ready");
      const loadingEl = document.getElementById("book-loading");
      if (loadingEl) loadingEl.remove();
    }

    document.body.classList.remove("almanac-resizing");

    const idx = pf.getCurrentPageIndex();
    lastBookPageIndex = idx;

    if (!sideTabsApi && bookTabs.length) {
      sideTabsApi = initSideTabs(bookTabs, () => pf, (pageIndex) => {
        lastBookPageIndex = pageIndex;
        syncAll(pageIndex, { collapseOnPageChange: false });
      });
    }
    syncAll(idx, { collapseOnPageChange: false });

    pf.on("flip", () => {
      const idx = pf.getCurrentPageIndex();
      const spec = pageSpecs[idx];
      if (spec?.kind === "html" && spec.htmlCached == null) {
        void loadHtmlContent(spec).then(() => wirePageImages(bookEl, scheduleReflow));
      }
      lastBookPageIndex = pf.getCurrentPageIndex();
      syncAll(lastBookPageIndex);
      wirePageImages(bookEl, scheduleReflow);
      scheduleReflow();
    });

    scheduleReflow();
    suppressRelayoutUntil = Date.now() + 750;
  }

  async function relayoutFromResize() {
    if (relayouting || Date.now() < suppressRelayoutUntil) return;

    await waitForViewportStable();

    const vp = measureViewport();
    if (vp.w < 120 || vp.h < 120) return;

    const spread = wantsSpreadLayout(vp.w, vp.h);
    const newMode = spread ? "spread" : "single";
    const layout = computeBookLayout(vp.w, vp.h, spread);
    const nextKey = layoutDimsKey(pageDimsFromLayout(layout));

    if (pf && newMode === layoutMode && nextKey === lastDimsKey) {
      applyShellLayout(layout);
      const ui = pf.getUI?.();
      if (ui && typeof ui.update === "function") ui.update();
      wirePageImages(bookEl, () => {
        const u = pf?.getUI?.();
        if (u && typeof u.update === "function") u.update();
      });
      document.body.classList.remove("almanac-resizing");
      return;
    }

    relayouting = true;
    const idx = pf ? pf.getCurrentPageIndex() : lastBookPageIndex;
    try {
      await mountAtPage(idx, { fromResize: true });
    } catch (err) {
      console.warn("Almanac remount failed, retrying fresh", err);
      clearPageTemplateCache();
      try {
        await mountAtPage(idx, { fromResize: true, forceFreshPages: true });
      } catch (err2) {
        console.error("Almanac remount failed twice", err2);
        if (!pageFlipInstance) {
          showEmpty(
            bookEl,
            "<strong>Book layout broke after resize.</strong><br />Reload the page, or widen the window and try again.",
          );
        }
      }
    } finally {
      relayouting = false;
      document.body.classList.remove("almanac-resizing");
    }
  }

  let orientT = 0;
  const scheduleRelayout = (delayMs) => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      relayoutFromResize();
    }, delayMs);
  };

  const onResize = () => scheduleRelayout(VIEW.resizeDebounceMs);

  const onOrientationChange = () => {
    suppressRelayoutUntil = Date.now() + 80;
    window.clearTimeout(orientT);
    orientT = window.setTimeout(() => {
      scheduleRelayout(VIEW.orientationDebounceMs);
    }, 50);
  };

  initChromeAutoHide(chrome);

  waitLayout(async () => {
    const loadingEl = document.getElementById("book-loading");
    if (loadingEl) loadingEl.textContent = "Opening…";

    await preloadPriorityPages(pageSpecs);
    await mountAtPage(0);
    preloadAllPageHtmlBackground(pageSpecs);

    if (!navBound) {
      navBound = true;
      prevBtn.addEventListener("click", () => pageFlipInstance?.flipPrev("top"));
      nextBtn.addEventListener("click", () => pageFlipInstance?.flipNext("top"));
    }

    if (!chinBound && chrome?.chinToggle) {
      chinBound = true;
      chrome.chinToggle.addEventListener("click", () => {
        const open = !chrome.footer.classList.contains("chin-open");
        setChinOpen(chrome, open);
        if (pageFlipInstance && syncChrome) {
          syncChrome(pageFlipInstance.getCurrentPageIndex(), {
            collapseOnPageChange: false,
            twoPageOpen: layoutMode === "spread",
          });
        }
      });
    }

    if (!keyBound) {
      keyBound = true;
      window.addEventListener(
        "keydown",
        (e) => {
          if (!pageFlipInstance || e.target.closest("input, textarea, select")) return;
          if (e.key === "ArrowLeft" || e.key === "PageUp") {
            e.preventDefault();
            pageFlipInstance.flipPrev("top");
          } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
            e.preventDefault();
            pageFlipInstance.flipNext("top");
          }
        },
        { passive: false },
      );
    }

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize, { passive: true });
    }

    const caseEl = document.getElementById("almanac-case");
    if (caseEl && typeof ResizeObserver !== "undefined") {
      const caseRo = new ResizeObserver(() => scheduleRelayout(VIEW.resizeDebounceMs));
      caseRo.observe(caseEl);
    }
  });
}

async function fetchManifest() {
  const r = await fetch(new URL(CONFIG.manifest, window.location.href), { cache: "force-cache" });
  if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
  return r.json();
}

async function main() {
  const bookEl = document.getElementById("book");
  const prevBtn = document.getElementById("nav-prev");
  const nextBtn = document.getElementById("nav-next");

  const flipWarm = ensurePageFlip(false).catch(() => null);

  let manifest;
  try {
    [manifest] = await Promise.all([fetchManifest(), flipWarm]);
  } catch (err) {
    showEmpty(
      bookEl,
      `<strong>Could not load almanac manifest.</strong><br />Run <code>python tools/build_almanac.py</code> then serve this folder.<br />${String(err.message || err)}`,
    );
    return;
  }

  const preferLocalVendor = manifest.preferLocalPageFlip === true;

  try {
    if (!globalThis.St?.PageFlip) await ensurePageFlip(preferLocalVendor);
  } catch (err) {
    document.body.classList.remove("almanac-loading");
    showEmpty(
      bookEl,
      `<strong>Page flip library failed to load.</strong><br />Need internet once for the flip engine, or run:<br /><code>powershell .\\scripts\\pull-page-flip.ps1</code><br />${String(err.message || err)}`,
    );
    return;
  }

  const PageFlip = globalThis.St.PageFlip;

  let pageSpecs;
  try {
    pageSpecs = normalizePageSpecs(manifest);
  } catch (err) {
    showEmpty(bookEl, `<strong>Invalid manifest.</strong><br />${String(err.message || err)}`);
    return;
  }

  if (pageSpecs.length === 0) {
    showEmpty(bookEl, "<strong>No pages in manifest.</strong>");
    return;
  }

  const chrome = collectChromeRefs();
  applyShellLabels(manifest, chrome);
  initMagazine(PageFlip, bookEl, prevBtn, nextBtn, pageSpecs, chrome, manifest.tabs || []);
}

main();
