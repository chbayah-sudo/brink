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

/** Replace `find` exactly `count` times, or throw. */
const patchAll = (text, find, replace, count, what) => {
  const n = text.split(find).length - 1;
  if (n !== count) throw new Error(`patchAll "${what}": expected ${count}, found ${n}`);
  return text.split(find).join(replace);
};

/** Cut the region between two markers out of `text`, asserting both are unique. */
const cut = (text, startMark, endMark, what) => {
  if (text.split(startMark).length - 1 !== 1)
    throw new Error(`cut "${what}": start marker is not unique`);
  if (text.split(endMark).length - 1 !== 1)
    throw new Error(`cut "${what}": end marker is not unique`);
  const a = text.indexOf(startMark);
  const b = text.indexOf(endMark);
  if (b <= a) throw new Error(`cut "${what}": end marker precedes start`);
  return { before: text.slice(0, a), body: text.slice(a, b), after: text.slice(b) };
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
  // factors: the "What Brink sees" panel (why the estimate reads as it does)
  [
    `        <div style="padding:24px 28px;border-right:2px solid var(--color-divider)">
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
              <h2 style="font-size:24px;margin:0">What Brink sees</h2>`,
    `        <div data-tour="factors" data-tip="The factors behind the current estimate, ranked by weight.&#10;Technical swaps the plain wording for the underlying measure." style="padding:24px 28px;border-right:2px solid var(--color-divider)">
            <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px">
              <h2 style="font-size:24px;margin:0">What Brink sees</h2>`,
    "anchor factors",
  ],
  // prediction: the "Approaching your brink" projection panel
  [
    `          <div style="padding:24px 28px">
            <h2 style="font-size:24px;margin:0">Approaching your brink</h2>`,
    `          <div data-tour="prediction" data-tip="Projected decline over the next 40 minutes.&#10;The shaded band is confidence: it widens when signals disagree." style="padding:24px 28px">
            <h2 style="font-size:24px;margin:0">Approaching your brink</h2>`,
    "anchor prediction",
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

// ── 6. Dashboard hierarchy: the operating loop opens Live State ───────────
// The export opened on three goal trackers, which reads as a habit app before
// any neuroperformance intelligence is visible. Live State now opens on the
// loop itself — NOW, FORECAST, ACTION, LEARNING — and the goal planner moves to
// Capacity Profile, next to the longitudinal model it belongs beside.
//
// Every value below already existed in SCEN(), ivLib or learnStats. Nothing is
// invented: where a scenario has no tested intervention (strength) or no
// delivery this session (meditation), LEARNING says exactly that instead of
// borrowing another scenario's numbers. An abstain is a feature here.

// 6a. Per-scenario extensions, merged onto SCEN() once it has built.
//     pred.* fixes the labels and axis that the export reused across every
//     scenario; now/act/learn feed the four loop modules.
const ACCENT = "var(--color-accent-700)";
const SCEN_EXT = {
  deepwork: {
    live: 0,
    pred: {
      legend: "Estimated decline likelihood",
      baseLegend: "Your typical deep-work curve",
      effectsLabel: "Expected form of decline",
      ticks: ["+10 min", "+20 min", "+30 min", "+40 min"],
      event: "Meaningful decline in sustained attention",
      horizon: "Next 40 minutes",
      uncertainty: "87% · onset error ±4.1 min",
      precedent: "Same precursor preceded decline in 5 of 6 prior deep-work sessions",
    },
    now: {
      activity: "Product strategy session",
      elapsed: "1h 42m",
      signal: "EEG 96% · 7/7 channels",
    },
    act: {
      grade: "SELECTED FROM MEASURED RESPONSES",
      why: "Blink rate is up 18% and HRV has fallen for 16 minutes — the precursor pair this pattern usually starts with.",
      delivery: "Haptic on-device · 4.5 breaths/min",
      safety: "Skip it if you are mid-conversation; Brink re-offers.",
    },
    learn: {
      grade: "MEASURED · 11 PRIOR DELIVERIES",
      title: "Breathing is the preferred reset here",
      body: "Nothing delivered yet this session. The action to the left is chosen from what has already been measured on you, not from a default.",
      rows: [
        ["Tested", "11 deliveries", ""],
        ["Median effect", "+31 min focus", ""],
        ["Selection weight", "0.71 · preferred", ACCENT],
      ],
    },
  },
  meditation: {
    live: 0,
    pred: {
      legend: "Likelihood of reaching your settled pattern",
      baseLegend: "Your typical settling curve",
      effectsLabel: "What settling looks like for you",
      ticks: ["+2 min", "+4 min", "+6 min", "+8 min"],
      event: "Reaching your settled meditation pattern",
      horizon: "Next 8 minutes",
      uncertainty: "91% · highest of any scenario",
      precedent: "About 3 minutes faster than your 30-day average",
    },
    now: {
      activity: "Guided meditation",
      elapsed: "16 min",
      signal: "EEG 96% · 7/7 channels",
    },
    act: {
      grade: "NO ACTION QUEUED",
      why: "Every settling marker is moving the right way. Interrupting would cost more than it returns.",
      delivery: "None queued",
      safety: "Brink stays silent while settling is on track.",
    },
    learn: {
      grade: "NO UPDATE THIS SESSION",
      title: "Nothing to learn from yet",
      body: "No intervention has been delivered, so nothing about the model has changed. A session that needs no help teaches it very little.",
      rows: [
        ["This session", "No delivery", ""],
        ["Model change", "None", ""],
        ["Last update", "Day 21 · breathing preference", ""],
      ],
    },
  },
  running: {
    live: 0,
    pred: {
      legend: "Estimated likelihood of form breakdown",
      baseLegend: "Your typical rep-quality curve",
      effectsLabel: "What breakdown looks like for you",
      ticks: ["Rep 6", "Rep 7", "Rep 8", "Rep 8 end"],
      window: [0.5, 0.75],
      event: "Running-form breakdown",
      horizon: "Remaining 3 reps",
      uncertainty: "72% · motion-limited",
      precedent: "A cue at this point delayed breakdown by ~4 min in similar sessions",
    },
    now: {
      activity: "Interval run · rep 5 of 8",
      elapsed: "38 min",
      signal: "EEG 72% · 5/7 ch · motion-limited",
      signalColor: ACCENT,
    },
    act: {
      grade: "SELECTED FROM MEASURED RESPONSES",
      why: "The perceived-effort proxy is rising faster than movement efficiency, so a cue targets cadence before form actually breaks.",
      delivery: "Haptic cadence cue · fires on form drift",
      safety: "Stop for pain, dizziness or chest symptoms. Brink cannot detect those.",
      safetyColor: ACCENT,
    },
    learn: {
      grade: "MEASURED · 6 PRIOR DELIVERIES",
      title: "Cadence cues have bought you about 4 minutes",
      body: "Not delivered yet this rep. Its weight comes from six measured deliveries in this same late-run context.",
      rows: [
        ["Tested", "6 deliveries", ""],
        ["Median effect", "+4 min form", ""],
        ["Selection weight", "0.66 · active", ACCENT],
      ],
    },
  },
  strength: {
    live: 2,
    pred: {
      legend: "Estimated set-quality likelihood",
      baseLegend: "Your typical recovery curve",
      effectsLabel: "What starting early costs you",
      ticks: ["0:45", "1:30", "2:15", "3:00"],
      onset: 0.72,
      window: [0.93, 1],
      sub: "Estimated likelihood of a full-quality set, by how long you rest.",
      event: "A set at full set-one quality",
      horizon: "By 3:00 of rest",
      uncertainty: "81% · rest-duration model",
      precedent: "Your best sets this block started after 2:50–3:10 of rest",
    },
    now: {
      activity: "Back squat · set 4 of 5",
      elapsed: "Rest 2:20 of 3:00",
      signal: "EEG 96% · 7/7 channels",
    },
    act: {
      grade: "GUIDANCE · NOT A TESTED INTERVENTION",
      why: "A set started now is estimated at 88% of set-one quality against about 95% if you wait the remaining 40 seconds.",
      delivery: "Haptic ready-cue at 3:00",
      safety: "Stop for pain, dizziness or loss of technique. Brink cannot detect those.",
      safetyColor: ACCENT,
    },
    learn: {
      grade: "NO TESTED INTERVENTION",
      title: "This one is not a learned effect",
      body: "No between-set intervention has ever been tested on you. The rest advice comes from your own recovery curve, so Brink offers it as guidance rather than something it has measured working.",
      rows: [
        ["Tested", "0 deliveries", ""],
        ["Basis", "Your median between-set recovery", ""],
        ["Model change", "None", ""],
      ],
    },
  },
  postint: {
    live: 3,
    pred: {
      legend: "Updated decline likelihood, after the reset",
      // Not "pre-reset projection": predBase is the same generic reference
      // curve in every scenario, so naming it as this session's counterfactual
      // would claim a series the chart does not actually hold.
      baseLegend: "Your typical decline curve",
      effectsLabel: "What the reset bought you",
      ticks: ["3:49 PM", "4:00 PM", "4:12 PM", "4:23 PM"],
      event: "Decline onset, re-forecast after the reset",
      horizon: "Next 45 minutes",
      uncertainty: "89% · onset error ±4.1 min",
      precedent: "Response shape matched 5 prior successful resets",
    },
    now: {
      activity: "Recovering · post-intervention",
      elapsed: "6 min since delivery",
      signal: "EEG 96% · 7/7 channels",
    },
    act: {
      grade: "NO ACTION QUEUED",
      why: "The precursor that triggered the reset has cleared, so the queue is empty.",
      delivery: "Delivered 3:32 PM · haptic on-device",
      safety: "Resume gradually; the estimate assumes the same task.",
    },
    learn: {
      grade: "MEASURED RESPONSE · NOT RANDOMISED",
      title: "It worked, and the model moved",
      body: "Measured within two minutes of the 3:32 PM delivery. The response landed inside the predicted band, so this intervention now ranks first in this context.",
      rows: [
        ["HRV recovery", "+11%", ACCENT],
        ["Attention stability", "+7%", ACCENT],
        ["Selection weight", "0.62 → 0.71", ACCENT],
      ],
    },
  },
};

template = patch(template, `  SCEN(){ return {`, `  SCEN(){ const S = {`, "SCEN open");
template = patch(
  template,
  ` was timed.' } }
  }; }`,
  ` was timed.' } }
  };
  const EXT = ${JSON.stringify(SCEN_EXT).replace(/<\//g, "<\\/")};
  for (const k in EXT){ const e = EXT[k];
    Object.assign(S[k].pred, e.pred || {});
    S[k].now = e.now; S[k].act = e.act; S[k].learn = e.learn; S[k].live = e.live; }
  return S; }`,
  "scenario extensions",
);

// 6b. The forecast x-axis was hardcoded to 40 minutes for all five scenarios,
//     so "wait 40 seconds" was plotted on a 40-minute axis and meditation's
//     "~4 min" marker sat at +11 to +20 min. Ticks now come from the scenario.
template = patch(
  template,
  `    const predGrid = [0.25,0.5,0.75,1].map(u=>({ x:(px0+(px1-px0)*u).toFixed(0), t:'+'+Math.round(u*40)+' min' }));`,
  `    const predTicks = P.ticks || ['+10 min','+20 min','+30 min','+40 min'];
    const predGrid = [0.25,0.5,0.75,1].map((u,i)=>({ x:(px0+(px1-px0)*u).toFixed(0), t:predTicks[i] }));`,
  "scenario forecast axis",
);

// 6c. Build the four loop modules and the one-line goal strip.
template = patch(
  template,
  `    return {
      canvasRef: this.canvasRef,`,
  `    // The operating loop as four ordered beats. sc.now / sc.act / sc.learn
    // come from the scenario tables; the rest is already-bound state.
    const NW = sc.now||{}, AC = sc.act||{}, LR = sc.learn||{};
    const liveIdx = typeof sc.live === 'number' ? sc.live : 0;
    const row = (k,v,c) => ({ k, v, color: c || 'var(--color-text)' });
    // Short facts go in the tabular rows; anything sentence-length goes in the
    // note, full width, or it gets crushed into the right-hand value column.
    const loopDefs = [
      ['01','Now', NW.grade || 'MEASURED SIGNALS · INFERRED STATE', sc.title, sc.narrative,
        [row('Activity', NW.activity), row('Elapsed', NW.elapsed), row('Signal quality', NW.signal, NW.signalColor)],
        null],
      ['02','Forecast','PREDICTED · MODEL-ESTIMATED', P.event || 'Decline onset', P.headline,
        [row('Window', P.winLabel, 'var(--color-accent-700)'), row('Horizon', P.horizon), row('Confidence', P.uncertainty)],
        P.precedent ? ['Personal precedent', P.precedent, ''] : null],
      ['03','Action', AC.grade || 'SELECTED FROM MEASURED RESPONSES', sc.rec, AC.why,
        [row('Delivery', AC.delivery)],
        AC.safety ? ['Safety boundary', AC.safety, AC.safetyColor] : null],
      ['04','Learning', LR.grade || '', LR.title, LR.body,
        (LR.rows||[]).map(r => row(r[0], r[1], r[2])), null]
    ];
    const loopSteps = loopDefs.map((d,i)=>({
      n:d[0], k:d[1], grade:d[2], title:d[3], body:d[4], rows:d[5],
      hasNote: !!d[6], noteK: d[6] ? d[6][0] : '', noteV: d[6] ? d[6][1] : '',
      noteColor: (d[6] && d[6][2]) || 'var(--color-neutral-800)',
      numColor: i===liveIdx ? 'var(--color-accent-700)' : 'var(--color-neutral-600)',
      cellStyle: 'min-width:0;padding:0 20px 18px;border-top:3px solid '
        + (i===liveIdx ? 'var(--color-accent)' : 'color-mix(in srgb, var(--color-text) 14%, transparent)')
        + (i<3 ? ';border-right:2px solid var(--color-divider)' : '')
    }));
    // Goals keeps a one-line presence here; the planner itself lives in
    // Capacity Profile now.
    const gLead = (goalRows && goalRows.length) ? goalRows[0] : null;
    return {
      hasGoal: !!gLead,
      goalLeadTitle: gLead ? gLead.title : '',
      goalLeadCaption: gLead ? gLead.caption : '',
      goalLeadStatus: gLead ? gLead.status : '',
      goalLeadColor: gLead ? gLead.statusColor : 'var(--color-text)',
      loopSteps,
      canvasRef: this.canvasRef,`,
  "loop modules + goal strip state",
);

// 6d. Expose the per-scenario legend strings the chart labels now bind to.
template = patch(
  template,
  `      predSub:P.sub, predLine:line, predBase:base, predBand, predGrid,`,
  `      predSub:P.sub, predLine:line, predBase:base, predBand, predGrid,
      predLegend:P.legend||'Estimated decline likelihood', predBaseLegend:P.baseLegend||'Your typical baseline',
      predEffectsLabel:P.effectsLabel||'Expected form of decline', predPrecedent:P.precedent||'',`,
  "forecast legend bindings",
);

// 6e. Live State markup: lift the goal planner out, and replace the whole
//     opening grid with the goal strip + the four-beat loop band. The planner
//     markup is re-homed verbatim (its data-tour anchors travel with it).
const liveOpenMark = `      <sc-if value="{{ showLive }}" hint-placeholder-val="{{ true }}">\n`;
const dimsOpenMark = `        <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:2px solid var(--color-divider)">`;
const live = cut(template, liveOpenMark, dimsOpenMark, "live state opening region");
const openingRegion = live.body.slice(liveOpenMark.length);

const goalsColMark = `          <div style="border-right:2px solid var(--color-divider);min-height:460px;display:flex;flex-direction:column">`;
const narrativeColMark = `          <div style="display:flex;flex-direction:column">\n            <div data-tour="narrative"`;
const goals = cut(openingRegion, goalsColMark, narrativeColMark, "goal planner column");
const goalPlanner = goals.body
  .replace(`border-right:2px solid var(--color-divider);min-height:460px;`, ``)
  .replace(`>Goals</div>`, `>Goals and plans</div>`);

const loopBand = `        <sc-if value="{{ hasGoal }}" hint-placeholder-val="{{ true }}">
          <div style="display:flex;align-items:baseline;gap:12px;padding:9px 28px;border-bottom:1px solid var(--color-divider);flex-wrap:wrap">
            <span style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-500);flex:none">Goal</span>
            <span style="font-size:12px;font-weight:600">{{ goalLeadTitle }}</span>
            <span style="font-size:11px;color:var(--color-neutral-600);font-variant-numeric:tabular-nums;min-width:0">{{ goalLeadCaption }}</span>
            <div style="flex:1"></div>
            <span style="font-size:11px;font-weight:600;color:{{ goalLeadColor }};flex:none">{{ goalLeadStatus }}</span>
            <span style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);flex:none">Plans live in Capacity Profile</span>
          </div>
        </sc-if>

        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:16px 28px 12px">
          <div style="font-family:var(--font-heading);font-weight:800;font-size:13px;letter-spacing:.14em;text-transform:uppercase">The loop</div>
          <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500)">What Brink learns in 04 changes 01 next session</div>
        </div>
        <div data-tour="loop" data-tip="One state, one forecast, one action, one measured result.&#10;The whole product, in four beats." style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-bottom:2px solid var(--color-divider)">
          <sc-for list="{{ loopSteps }}" as="ls" hint-placeholder-count="4">
            <div style="{{ ls.cellStyle }}">
              <div style="display:flex;align-items:baseline;gap:8px;margin-top:13px">
                <span style="font-variant-numeric:tabular-nums;font-size:11px;font-weight:700;color:{{ ls.numColor }}">{{ ls.n }}</span>
                <span style="font-family:var(--font-heading);font-weight:800;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:{{ ls.numColor }}">{{ ls.k }}</span>
              </div>
              <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);margin-top:9px;min-height:24px;text-wrap:pretty">{{ ls.grade }}</div>
              <div style="font-family:var(--font-heading);font-weight:800;font-size:16px;line-height:1.22;margin-top:4px;text-wrap:pretty">{{ ls.title }}</div>
              <p style="font-size:12px;line-height:1.55;margin:9px 0 0;color:var(--color-neutral-800);text-wrap:pretty">{{ ls.body }}</p>
              <div style="margin-top:13px">
                <sc-for list="{{ ls.rows }}" as="r" hint-placeholder-count="3">
                  <div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-top:1px solid color-mix(in srgb, var(--color-text) 11%, transparent)">
                    <span style="letter-spacing:.08em;text-transform:uppercase;font-size:9px;color:var(--color-neutral-600);padding-top:2px;flex:none">{{ r.k }}</span>
                    <span style="font-variant-numeric:tabular-nums;font-size:11px;text-align:right;color:{{ r.color }}">{{ r.v }}</span>
                  </div>
                </sc-for>
              </div>
              <sc-if value="{{ ls.hasNote }}" hint-placeholder-val="{{ false }}">
                <div style="margin-top:11px;padding-top:9px;border-top:1px solid color-mix(in srgb, var(--color-text) 11%, transparent)">
                  <div style="letter-spacing:.08em;text-transform:uppercase;font-size:9px;color:var(--color-neutral-600);margin-bottom:4px">{{ ls.noteK }}</div>
                  <p style="font-size:11.5px;line-height:1.5;margin:0;color:{{ ls.noteColor }};text-wrap:pretty">{{ ls.noteV }}</p>
                </div>
              </sc-if>
            </div>
          </sc-for>
        </div>

`;
template = live.before + liveOpenMark + loopBand + live.after;

// Re-home the planner as the first block of Capacity Profile.
template = patch(
  template,
  `      <sc-if value="{{ showProfile }}" hint-placeholder-val="{{ false }}">\n`,
  `      <sc-if value="{{ showProfile }}" hint-placeholder-val="{{ false }}">
        <div style="display:flex;flex-direction:column;border-bottom:2px solid var(--color-divider)">
${goalPlanner}        </div>
`,
  "re-home goal planner",
);

// 6f. Chart labels were static while the quantity they name is per-scenario:
//     meditation plotted "reaching your settled pattern" under a legend
//     reading "Estimated decline likelihood".
template = patch(
  template,
  `>Estimated decline likelihood</span>`,
  `>{{ predLegend }}</span>`,
  "forecast legend",
);
template = patch(
  template,
  `>Your typical baseline</span>`,
  `>{{ predBaseLegend }}</span>`,
  "forecast baseline legend",
);
template = patch(
  template,
  `>Expected form of decline</div>`,
  `>{{ predEffectsLabel }}</div>`,
  "forecast effects label",
);
// Say plainly which series were never observed, and give the forecast its
// personal precedent line.
template = patch(
  template,
  `            <p style="font-size:13px;line-height:1.55;font-weight:600;margin:0 0 12px;text-wrap:pretty">{{ predHeadline }}</p>`,
  `            <div style="font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--color-neutral-500);margin:0 0 10px">Dashed and shaded series are model-estimated, never observed</div>
            <p style="font-size:13px;line-height:1.55;font-weight:600;margin:0 0 12px;text-wrap:pretty">{{ predHeadline }}</p>`,
  "counterfactual labelling",
);

// 6g. Section role and maturity, so each area states what it is and how real
//     it is. Every number in this demo comes from a lookup table; the sidebar
//     carries that global caveat, the chip carries the per-section class.
template = patch(
  template,
  `      <h1 style="font-size:20px;margin:0;letter-spacing:-0.01em">{{ sectionTitle }}</h1>
      <div style="flex:1"></div>`,
  `      <div style="min-width:0">
        <h1 style="font-size:20px;margin:0;letter-spacing:-0.01em">{{ sectionTitle }}</h1>
        <div style="font-size:10px;color:var(--color-neutral-600);margin-top:2px">{{ sectionRole }}</div>
      </div>
      <span style="font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:var(--color-neutral-600);border:1px solid var(--color-divider);padding:4px 8px;flex:none">{{ sectionMaturity }}</span>
      <div style="flex:1"></div>`,
  "section role + maturity chip",
);
template = patch(
  template,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',`,
  `      navItems, scenarios, sectionTitle:names[st.section], clock:'3:38 PM',
      sectionRole: ({'Live State':'The loop, right now','Ask Brink':'Answers drawn only from your own data','Interventions':'What was delivered, and what it measurably did','Signal Studio':'The raw evidence, including what was excluded','Capacity Profile':'What 38 days taught the model, and your plans','Device':'What the band can and cannot see'})[names[st.section]] || '',
      sectionMaturity: ({'Live State':'Simulated output','Ask Brink':'Planned capability','Interventions':'Research model','Signal Studio':'Research model','Capacity Profile':'Research model','Device':'Simulated output'})[names[st.section]] || '',`,
  "section role + maturity state",
);
template = patch(
  template,
  `>Illustrative demo data<`,
  `>Illustrative demo data · every value on this screen is simulated<`,
  "global maturity caveat",
);

// 6h. Claim boundary. "Brink has high confidence this is causal for you" is the
//     sentence most likely to end a technical conversation badly; six
//     correlated sessions do not establish causation.
template = patch(
  template,
  `Repeated pattern · 6 supporting sessions · Brink has high confidence this is causal for you.`,
  `Repeated personal pattern · 6 supporting sessions · association, not established causation.`,
  "ask meta 1 causal",
);
template = patch(
  template,
  `Strong repeated pattern, not just correlation; it held when Brink controlled for sleep and workload.`,
  `Repeated personal pattern · 41 sessions over 38 days · observational; sleep and workload were adjusted for, not controlled.`,
  "ask meta 3 causal",
);
template = patch(
  template,
  `Yes, with high confidence. Within two minutes`,
  `Yes, on the measured response. Within two minutes`,
  "ask answer 2 confidence",
);
template = patch(
  template,
  `the trajectory Brink projected without intervention; the measured curve separated from it decisively.`,
  `the trajectory Brink estimated for no intervention, which was never observed. The measured curve separated from it within two minutes.`,
  "ask answer 2 counterfactual",
);
template = patch(
  template,
  `HRV, measured (red) vs. projected without intervention (dashed).`,
  `HRV, measured (red) vs. model-estimated counterfactual (dashed). The dashed line was never observed.`,
  "ask caption 2 counterfactual",
);
template = patch(
  template,
  `Based on 41 sessions · Brink has high confidence.`,
  `Based on 41 sessions. Repeated personal pattern, not a controlled result.`,
  "profile strongest evidence",
);
template = patch(
  template,
  `Selection weight · early-strain context · 6 supporting sessions`,
  `Selection weight · early-strain context · 6 supporting sessions · not randomised`,
  "intervention weight caveat",
);
template = patch(
  template,
  `Your brain has settled into a steady attention rhythm and is holding it.`,
  `Your attention rhythm has steadied and is holding.`,
  "brain-as-agent",
);
template = patch(
  template,
  `The current limitation appears more perceptual than mechanical.`,
  `The current pattern is more consistent with rising perceived effort than with the mechanical indicators.`,
  "perceptual vs mechanical",
);
template = patchAll(
  template,
  `Neural drive proxy`,
  `Effort-related neural feature`,
  2,
  "neural drive proxy",
);
template = patch(
  template,
  `Motor-adjacent beta rebound at 96% of set-one amplitude after 2:20 rest.`,
  `Motor-adjacent beta rebound at 96% of set-one amplitude after 2:20 rest. Experimental; not a direct measure of motor-unit drive.`,
  "effort feature caveat",
);
template = patchAll(
  template,
  `['Model confidence',`,
  `['Forecast confidence',`,
  4,
  "forecast confidence label",
);
template = patch(template, `>Brink Prototype 04<`, `>Brink Headband<`, "device heading");

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
