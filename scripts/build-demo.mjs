/**
 * Unpacks "Brink Dashboard Standalone.html" into public/demo/ as plain files.
 *
 * The standalone export is a self-unpacking bundle: every asset is base64'd
 * (gzip'd) into a manifest and rebuilt as blob: URLs at runtime. That is the
 * right shape for emailing a single file and the wrong shape for a web page.
 * It forces a ~4.7 MB download and a JS unpack before the first pixel, and the
 * video can't stream. This writes the same bytes out as real files instead, so
 * the browser streams the video, caches the fonts, and renders the identical
 * document.
 *
 * The patches below are re-applied on the way through. Each one exists because
 * of a problem the raw export causes when embedded on the marketing site, or
 * because the site asked for something the export doesn't do, and each asserts
 * on its anchor, so a re-export that moves the code fails the build rather than
 * silently shipping the regression.
 *
 *   node scripts/build-demo.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "Brink Dashboard Standalone.html");
const OUT_DIR = join(ROOT, "public", "demo");
const VENDOR = join(OUT_DIR, "vendor");
const ASSETS = join(OUT_DIR, "assets");

const island = (html, type) => {
  const m = html.match(
    new RegExp(`<script type="__bundler/${type}"[^>]*>([\\s\\S]*?)</script>`),
  );
  if (!m) throw new Error(`bundle is missing its ${type} island`);
  return JSON.parse(m[1]);
};

/** Replace `find` exactly once, or throw. */
const patch = (text, find, replace, what) => {
  const n = text.split(find).length - 1;
  if (n !== 1) throw new Error(`patch "${what}": expected 1 anchor, found ${n}`);
  return text.replace(find, replace);
};

const html = readFileSync(SRC, "utf8");
const manifest = island(html, "manifest");
const extResources = island(html, "ext_resources");
let template = island(html, "template");

// ── assets ────────────────────────────────────────────────────────────────
mkdirSync(VENDOR, { recursive: true });
mkdirSync(ASSETS, { recursive: true });

const cdnName = new Map(extResources.map((e) => [e.uuid, basename(e.id)]));
const paths = {};
let fontN = 0;

for (const [uuid, entry] of Object.entries(manifest)) {
  const bytes = entry.compressed
    ? gunzipSync(Buffer.from(entry.data, "base64"))
    : Buffer.from(entry.data, "base64");

  let rel;
  if (entry.mime === "video/mp4") rel = "assets/headband.mp4";
  else if (entry.mime === "font/woff2") rel = `vendor/archivo-${++fontN}.woff2`;
  else if (cdnName.has(uuid)) rel = `vendor/${cdnName.get(uuid)}`;
  else if (bytes.includes("@ds-bundle")) rel = "vendor/ds-bundle.js";
  else if (bytes.includes("dc-runtime")) rel = "vendor/support.js";
  else throw new Error(`unrecognised bundle entry ${uuid} (${entry.mime})`);

  const abs = join(OUT_DIR, rel);
  const same =
    existsSync(abs) &&
    createHash("sha256").update(readFileSync(abs)).digest("hex") ===
      createHash("sha256").update(bytes).digest("hex");
  if (!same) writeFileSync(abs, bytes);
  paths[uuid] = rel;
  console.log(`  ${same ? "=" : "+"} ${rel.padEnd(34)} ${bytes.length} B`);
}

// Absolute, not relative. Vercel strips the trailing slash, so this document
// is served at /demo rather than /demo/ and its base URL becomes the site root:
// a relative "vendor/support.js" resolves to /vendor/support.js and 404s, the
// runtime never loads, and the dashboard renders its raw {{ }} placeholders
// with the inline CSS still applied — looking built but never hydrating.
const urlFor = (rel) => `/demo/${rel}`;

for (const uuid of Object.keys(paths)) {
  template = template.split(uuid).join(urlFor(paths[uuid]));
}

// React/ReactDOM aren't <script> tags in the document. The dc-runtime resolves
// them through window.__resources and otherwise falls back to unpkg.com. Point
// them at the local copies so the demo owes nothing to a CDN at runtime.
const resources = Object.fromEntries(
  extResources.map((e) => [e.id, urlFor(paths[e.uuid])]),
);
const inject = `<script>window.__resources = ${JSON.stringify(resources).replace(
  /<\//g,
  "<\\/",
)};</script>`;
const head = template.match(/<head[^>]*>/i);
if (!head) throw new Error("template has no <head>");
const at = head.index + head[0].length;
template = template.slice(0, at) + inject + template.slice(at);

// ── embed patches ─────────────────────────────────────────────────────────
// 1. The capacity-field canvas lookup walks window.parent and sibling frames.
//    Standalone (own tab) that finds nothing; embedded same-origin in the site
//    it finds the site's OWN background canvases and paints HUD chips across
//    every section of the page.
template = patch(
  template,
  `      try{ const p = window.parent; if(p && p!==window){ push(p.document);
        for(let i=0;i<p.frames.length;i++){ try{ push(p.frames[i].document); }catch(e){} } } }catch(e){}
      try{ for(let i=0;i<window.frames.length;i++){ try{ push(window.frames[i].document); }catch(e){} } }catch(e){}`,
  `      // Own document only: reaching into window.parent here hijacks the host
      // page's canvases when this runs embedded on the marketing site.`,
  "canvas scope",
);

// 2. Nav order, and everything keyed off it. The export hardcodes a section's
//    position as its identity (section===3 means Interventions), so reordering
//    the list alone silently wires the wrong panel to the wrong nav item. These
//    patches look positions up by name instead, which makes `names` below the
//    single place to change if the order changes again.
template = patch(
  template,
  `    const names = ['Live State','Session Timeline','Signal Studio','Interventions','Capacity Profile','Ask Brink','Device'];`,
  `    const names = ['Live State','Ask Brink','Interventions','Signal Studio','Capacity Profile','Device'];
    const at = n => names.indexOf(n);`,
  "nav order",
);
template = patch(
  template,
  `      showLive: st.section===0, showTimeline: st.section===1, showSignals: st.section===2, showInterv: st.section===3, showProfile: st.section===4, showAsk: st.section===5, showDevice: st.section===6,`,
  `      showLive: st.section===at('Live State'), showTimeline: st.section===at('Session Timeline'), showSignals: st.section===at('Signal Studio'), showInterv: st.section===at('Interventions'), showProfile: st.section===at('Capacity Profile'), showAsk: st.section===at('Ask Brink'), showDevice: st.section===at('Device'),`,
  "panel routing",
);
template = patch(
  template,
  `      ivHrv, ivAtt, weightGrow: st.section===3? '9%':'0%',`,
  `      ivHrv, ivAtt, weightGrow: st.section===at('Interventions')? '9%':'0%',`,
  "interventions weight bar",
);

// 3. Scenario switcher only where scenarios change anything. On Interventions,
//    Capacity Profile, Ask Brink and Device the panels are identical whichever
//    scenario is picked, so the control reads as broken rather than optional.
//    Session Timeline is dropped from `names` above, so its panel never routes
//    and its markup below is inert.
template = patch(
  template,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',`,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',
      showScenarios: ['Live State','Signal Studio'].indexOf(names[st.section])>=0,`,
  "showScenarios flag",
);
template = patch(
  template,
  `      <span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-600)">Scenario</span>
      <div style="display:flex;border:1px solid var(--color-divider)">
        <sc-for list="{{ scenarios }}" as="sc" hint-placeholder-count="5">
          <button sc-camel-on-click="{{ sc.go }}" style="{{ sc.style }}" style-hover="background:color-mix(in srgb, var(--color-text) 8%, transparent)">{{ sc.label }}</button>
        </sc-for>
      </div>`,
  `      <sc-if value="{{ showScenarios }}" hint-placeholder-val="{{ true }}">
        <span style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-600)">Scenario</span>
        <div style="display:flex;border:1px solid var(--color-divider)">
          <sc-for list="{{ scenarios }}" as="sc" hint-placeholder-count="5">
            <button sc-camel-on-click="{{ sc.go }}" style="{{ sc.style }}" style-hover="background:color-mix(in srgb, var(--color-text) 8%, transparent)">{{ sc.label }}</button>
          </sc-for>
        </div>
      </sc-if>`,
  "showScenarios gate",
);

// 4. The band is presented as the product on the site, not as a prototype unit.
template = patch(
  template,
  ">Prototype 04 · Connected<",
  ">Headband · Connected<",
  "device label",
);

// 5. The guided walkthrough (WALKTHROUGH_SPEC.md). Three parts: a handle the
//    tour can drive the dashboard through, data-tour anchors on the twelve
//    elements the steps ring, and data-tip hover copy. The anchors are plain
//    attributes, so the dc-runtime carries them through to the real DOM.

// Hand the tour the same closures the dashboard's own buttons call, so
// navigating a step is indistinguishable from a click — and so the scenario
// can still be set on sections whose switcher is hidden. Re-assigned every
// render, which keeps it valid across the live loop's re-renders.
template = patch(
  template,
  `    const dims = sc.dims.map((d,i)=>{`,
  `    window.__dash = { names, navItems, scenarios, scenarioKeys: Object.keys(S) };
    const dims = sc.dims.map((d,i)=>{`,
  "tour dashboard handle",
);

// Anchors, in our current section order. Each is the container that frames the
// whole feature rather than a single line, so the ring reads as a box.
const anchors = [
  // device-status: the connection / fit / latency lines get their own wrapper
  // so the ring doesn't have to swallow the wordmark above them.
  [
    `      <div style="display:flex;align-items:center;gap:8px;margin-top:16px;font-size:11px">`,
    `      <div data-tour="device-status" data-tip="Seven dry EEG channels, PPG, EDA and motion.&#10;96 ms is the delay between your body and this screen.">
      <div style="display:flex;align-items:center;gap:8px;margin-top:16px;font-size:11px">`,
    "anchor device-status (open)",
  ],
  [
    `      <div style="font-size:10px;color:var(--color-neutral-600);margin-top:4px;font-variant-numeric:tabular-nums">Fit good · 7 ch · 96 ms latency</div>`,
    `      <div style="font-size:10px;color:var(--color-neutral-600);margin-top:4px;font-variant-numeric:tabular-nums">Fit good · 7 ch · 96 ms latency</div>
      </div>`,
    "anchor device-status (close)",
  ],
  // scenario-switch: the segmented control itself, inside the sc-if patch 3 added.
  [
    `>Scenario</span>
        <div style="display:flex;border:1px solid var(--color-divider)">`,
    `>Scenario</span>
        <div data-tour="scenario-switch" data-tip="Not a theme. Each scenario changes which signals matter,&#10;what the numbers mean, and what Brink asks of you." data-tip-right style="display:flex;border:1px solid var(--color-divider)">`,
    "anchor scenario-switch",
  ],
  // goal-input: the input + Plan it row.
  [
    `              <div style="display:flex;gap:10px">`,
    `              <div data-tour="goal-input" data-tip="Plain words. Brink splits the goal into equal units and&#10;pre-places resets at the two times you historically fade." style="display:flex;gap:10px">`,
    "anchor goal-input",
  ],
  // goal-rows: the container holding every goal row.
  [
    `            <div style="flex:1">
              <sc-for list="{{ goalRows }}" as="g" hint-placeholder-count="3">`,
    `            <div data-tour="goal-rows" style="flex:1">
              <sc-for list="{{ goalRows }}" as="g" hint-placeholder-count="3">`,
    "anchor goal-rows",
  ],
  // the cell strip inside each goal row states its own unit.
  [
    `                  <div style="display:flex;gap:2px;height:10px;margin-top:12px">`,
    `                  <div data-tip="One cell = one real thing: a page, a morning, a day.&#10;Filled is done, gold is now, an outline is missed or scheduled." style="display:flex;gap:2px;height:10px;margin-top:12px">`,
    "tip goal cell strip",
  ],
  // narrative: the panel around the paragraph, not the <p> itself.
  [
    `            <div style="padding:20px 24px;border-bottom:1px solid var(--color-divider)">
              <p style="font-size:14px;line-height:1.6;margin:0;text-wrap:pretty">{{ narrative }}</p>`,
    `            <div data-tour="narrative" data-tip="Plain language first, figures underneath.&#10;Every claim is against your own baseline, not an average." style="padding:20px 24px;border-bottom:1px solid var(--color-divider)">
              <p style="font-size:14px;line-height:1.6;margin:0;text-wrap:pretty">{{ narrative }}</p>`,
    "anchor narrative",
  ],
  // rec: the recommendation block.
  [
    `            <div sc-camel-on-mouse-enter="{{ recHover }}" sc-camel-on-mouse-leave="{{ recLeave }}" style="padding:14px 24px;background:var(--color-surface)"`,
    `            <div data-tour="rec" data-tip="Exactly one next action, timed to the minute.&#10;It disappears entirely when nothing is needed." data-tip-up sc-camel-on-mouse-enter="{{ recHover }}" sc-camel-on-mouse-leave="{{ recLeave }}" style="padding:14px 24px;background:var(--color-surface)"`,
    "anchor rec",
  ],
  // The six remaining sections: the first container inside each sc-if.
  [
    `      <sc-if value="{{ showTimeline }}" hint-placeholder-val="{{ false }}">
        <div style="padding:24px 28px 8px">`,
    `      <sc-if value="{{ showTimeline }}" hint-placeholder-val="{{ false }}">
        <div data-tour="timeline" style="padding:24px 28px 8px">`,
    "anchor timeline",
  ],
  [
    `      <sc-if value="{{ showSignals }}" hint-placeholder-val="{{ false }}">
        <div style="display:flex;align-items:center;gap:10px;padding:16px 28px;border-bottom:2px solid var(--color-divider);flex-wrap:wrap">`,
    `      <sc-if value="{{ showSignals }}" hint-placeholder-val="{{ false }}">
        <div data-tour="signals" style="display:flex;align-items:center;gap:10px;padding:16px 28px;border-bottom:2px solid var(--color-divider);flex-wrap:wrap">`,
    "anchor signals",
  ],
  [
    `      <sc-if value="{{ showInterv }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid var(--color-divider)">`,
    `      <sc-if value="{{ showInterv }}" hint-placeholder-val="{{ false }}">
        <div data-tour="interv" style="display:grid;grid-template-columns:1fr 1fr;border-bottom:2px solid var(--color-divider)">`,
    "anchor interv",
  ],
  [
    `      <sc-if value="{{ showProfile }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:1fr 400px;border-bottom:2px solid var(--color-divider)">`,
    `      <sc-if value="{{ showProfile }}" hint-placeholder-val="{{ false }}">
        <div data-tour="profile" style="display:grid;grid-template-columns:1fr 400px;border-bottom:2px solid var(--color-divider)">`,
    "anchor profile",
  ],
  [
    `      <sc-if value="{{ showAsk }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:340px 1fr;min-height:100%">`,
    `      <sc-if value="{{ showAsk }}" hint-placeholder-val="{{ false }}">
        <div data-tour="ask" style="display:grid;grid-template-columns:340px 1fr;min-height:100%">`,
    "anchor ask",
  ],
  [
    `      <sc-if value="{{ showDevice }}" hint-placeholder-val="{{ false }}">
        <div style="display:grid;grid-template-columns:1fr 380px">`,
    `      <sc-if value="{{ showDevice }}" hint-placeholder-val="{{ false }}">
        <div data-tour="device" style="display:grid;grid-template-columns:1fr 380px">`,
    "anchor device",
  ],
];

for (const [find, replace, what] of anchors) {
  template = patch(template, find, replace, what);
}

// Hover tips (spec §2) plus the tour bundle, both appended to the document.
const tipCss = `
[data-tip] { position: relative; }
[data-tip]:hover::after {
  content: attr(data-tip);
  position: absolute; left: 8px; top: calc(100% + 7px); z-index: 80;
  width: max-content; max-width: 270px; white-space: pre-line;
  background: var(--color-neutral-900); color: var(--color-bg);
  font-family: var(--font-body); font-size: 11px; line-height: 1.5;
  padding: 9px 11px; box-shadow: var(--shadow-md); pointer-events: none;
}
[data-tip]:hover::before {
  content: ""; position: absolute; left: 16px; top: 100%;
  border: 5px solid transparent; border-bottom-color: var(--color-neutral-900);
  z-index: 81; pointer-events: none;
}
[data-tip-up]:hover::after  { top: auto; bottom: calc(100% + 7px); }
[data-tip-up]:hover::before { top: auto; bottom: 100%; border-bottom-color: transparent; border-top-color: var(--color-neutral-900); }
[data-tip-right]:hover::after  { left: auto; right: 8px; }
[data-tip-right]:hover::before { left: auto; right: 16px; }
`;

const tourJs = readFileSync(join(ROOT, "scripts", "demo-tour.js"), "utf8");
const bodyClose = template.lastIndexOf("</body>");
if (bodyClose < 0) throw new Error("template has no </body>");
template =
  template.slice(0, bodyClose) +
  `<style>${tipCss}</style>\n<script>\n${tourJs}\n</script>\n` +
  template.slice(bodyClose);

writeFileSync(join(OUT_DIR, "index.html"), template);
console.log(`  + index.html                        ${template.length} B`);

// Superseded by the unpacked build above; leaving them served would keep a
// second, differently-themed copy of the dashboard reachable.
for (const stale of ["Brink Dashboard.dc.html", "support.js", "_ds"]) {
  const p = join(OUT_DIR, stale);
  if (existsSync(p)) {
    rmSync(p, { recursive: true });
    console.log(`  - ${stale} (superseded)`);
  }
}
