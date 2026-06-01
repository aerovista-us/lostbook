/**
 * Things Worth Remembering — found notebook (StPageFlip).
 * HTML leaves from almanac-manifest.json (built by tools/build_almanac.py).
 */

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
  pageMinWidthSingle: 260,
  pageMinWidthSpread: 240,
  pageMinHeight: 320,
  pageMaxWidthSpread: 680,
  resizeDebounceMs: 120,
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
function computeBookLayout(viewportW, viewportH, spread) {
  const aspect = readPageAspect();
  const chromeH = measureChromeHeight();
  const pad = VIEW.deskPad * 2;
  const availW = viewportW - pad;
  const availH = viewportH - pad;

  let caseW;
  let caseH;
  let pageW;
  let pageH;

  if (!spread) {
    /* Portrait / single-page: fill the screen; page fits inside chrome. */
    caseW = availW;
    caseH = availH;
    const bookAreaW = caseW - VIEW.casePadX - VIEW.shellInsetX;
    const bookAreaH = caseH - VIEW.casePadY - VIEW.shellInsetY - chromeH;

    pageW = bookAreaW;
    pageH = Math.floor(pageW / aspect);
    if (pageH > bookAreaH) {
      pageH = bookAreaH;
      pageW = Math.floor(pageH * aspect);
    }
    pageW = Math.max(VIEW.pageMinWidthSingle, pageW);
    pageH = Math.max(VIEW.pageMinHeight, pageH);
  } else {
    caseW = availW;
    caseH = availH;
    const bookAreaW = caseW - VIEW.casePadX - VIEW.shellInsetX;
    const bookAreaH = caseH - VIEW.casePadY - VIEW.shellInsetY - chromeH;

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
  const res = await fetch(spec.resolved, { cache: "no-store" });
  if (!res.ok) throw new Error(`${spec.src} → HTTP ${res.status}`);
  spec.htmlCached = await res.text();
  return spec.htmlCached;
}

function showEmpty(bookEl, message) {
  bookEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "empty-state";
  wrap.innerHTML = message;
  bookEl.appendChild(wrap);
}

async function buildPageElements(pageSpecs) {
  const frag = document.createDocumentFragment();
  const pages = [];

  for (let i = 0; i < pageSpecs.length; i++) {
    const spec = pageSpecs[i];
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
      try {
        wrap.innerHTML = await loadHtmlContent(spec);
      } catch (err) {
        wrap.innerHTML = `<div class="fp"><p>Could not load page: ${String(err.message || err)}</p></div>`;
      }
      page.appendChild(wrap);
    }

    frag.appendChild(page);
    pages.push(page);
  }
  return { frag, pages };
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

function initMagazine(PageFlip, bookEl, prevBtn, nextBtn, pageSpecs, chrome) {
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

  const syncAll = (idx, opts = {}) => {
    syncNav(pf, prevBtn, nextBtn);
    if (syncChrome) {
      syncChrome(idx, {
        ...opts,
        twoPageOpen: layoutMode === "spread",
      });
    }
  };

  async function mountAtPage(startPage = 0) {
    const vp = measureViewport();
    const spread = wantsSpreadLayout(vp.w, vp.h);
    let layout = computeBookLayout(vp.w, vp.h, spread);
    applyShellLayout(layout);
    layoutMode = spread ? "spread" : "single";

    await new Promise((resolve) => waitLayout(resolve));

    const vp2 = measureViewport();
    if (spread === wantsSpreadLayout(vp2.w, vp2.h)) {
      layout = computeBookLayout(vp2.w, vp2.h, spread);
      applyShellLayout(layout);
      await new Promise((resolve) => waitLayout(resolve));
    }

    const dims = pageDimsFromLayout(layout);
    lastDimsKey = layoutDimsKey(dims);

    destroyPageFlip(pf);
    pf = null;
    pageFlipInstance = null;
    bookEl.replaceChildren();

    const { frag, pages } = await buildPageElements(pageSpecs);
    bookEl.appendChild(frag);

    const safeStart = Math.max(0, Math.min(startPage, pageSpecs.length - 1));
    pf = new PageFlip(
      bookEl,
      buildPageFlipOptions(dims, flippingTime, hasCover, safeStart),
    );
    pf.loadFromHTML(pages);
    pageFlipInstance = pf;

    const scheduleReflow = () => {
      const ui = pf?.getUI?.();
      if (ui && typeof ui.update === "function") ui.update();
    };
    wirePageImages(bookEl, scheduleReflow);

    document.body.classList.remove("almanac-loading");
    document.body.classList.add("almanac-ready");
    const loadingEl = document.getElementById("book-loading");
    if (loadingEl) loadingEl.remove();

    const idx = pf.getCurrentPageIndex();
    syncAll(idx, { collapseOnPageChange: false });

    pf.on("flip", () => {
      syncAll(pf.getCurrentPageIndex());
      wirePageImages(bookEl, scheduleReflow);
      scheduleReflow();
    });

    scheduleReflow();
    suppressRelayoutUntil = Date.now() + 650;
  }

  async function relayoutFromResize() {
    if (relayouting || !pf || Date.now() < suppressRelayoutUntil) return;

    const vp = measureViewport();
    const spread = wantsSpreadLayout(vp.w, vp.h);
    const newMode = spread ? "spread" : "single";
    const layout = computeBookLayout(vp.w, vp.h, spread);
    const nextKey = layoutDimsKey(pageDimsFromLayout(layout));

    if (newMode === layoutMode && nextKey === lastDimsKey) {
      const ui = pf.getUI?.();
      if (ui && typeof ui.update === "function") ui.update();
      return;
    }

    applyShellLayout(layout);

    relayouting = true;
    const idx = pf.getCurrentPageIndex();
    try {
      await mountAtPage(idx);
    } finally {
      relayouting = false;
    }
  }

  const onResize = () => {
    window.clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      relayoutFromResize();
    }, VIEW.resizeDebounceMs);
  };

  waitLayout(async () => {
    await mountAtPage(0);

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
    window.addEventListener("orientationchange", onResize, { passive: true });
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", onResize, { passive: true });
    }

  });
}

async function main() {
  const bookEl = document.getElementById("book");
  const prevBtn = document.getElementById("nav-prev");
  const nextBtn = document.getElementById("nav-next");

  let manifest;
  try {
    const r = await fetch(new URL(CONFIG.manifest, window.location.href), { cache: "no-store" });
    if (!r.ok) throw new Error(`Manifest HTTP ${r.status}`);
    manifest = await r.json();
  } catch (err) {
    showEmpty(
      bookEl,
      `<strong>Could not load almanac manifest.</strong><br />Run <code>python tools/build_almanac.py</code> then serve this folder.<br />${String(err.message || err)}`,
    );
    return;
  }

  const preferLocalVendor = manifest.preferLocalPageFlip === true;

  try {
    await ensurePageFlip(preferLocalVendor);
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
  initMagazine(PageFlip, bookEl, prevBtn, nextBtn, pageSpecs, chrome);
}

main();
