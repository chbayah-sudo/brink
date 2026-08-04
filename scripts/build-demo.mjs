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

for (const uuid of Object.keys(paths)) {
  template = template.split(uuid).join(paths[uuid]);
}

// React/ReactDOM aren't <script> tags in the document. The dc-runtime resolves
// them through window.__resources and otherwise falls back to unpkg.com. Point
// them at the local copies so the demo owes nothing to a CDN at runtime.
const resources = Object.fromEntries(
  extResources.map((e) => [e.id, paths[e.uuid]]),
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
  `    const names = ['Live State','Ask Brink','Interventions','Signal Studio','Capacity Profile','Session Timeline','Device'];
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
template = patch(
  template,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',`,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',
      showScenarios: ['Live State','Session Timeline','Signal Studio'].indexOf(names[st.section])>=0,`,
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
