/**
 * Guided walkthrough + hover tooltips for the embedded Brink dashboard.
 * Implements WALKTHROUGH_SPEC.md. Injected into public/demo/index.html by
 * scripts/build-demo.mjs — it is NOT bundled with the marketing site.
 *
 * This runs inside the demo iframe, alongside the dc-runtime rather than
 * inside it, so it holds no React state at all. That is deliberate: the
 * dashboard re-renders about once a second from its live loop, and the
 * measured rect living in a plain closure variable is the one thing that
 * re-render cannot reach (spec §4 Robustness).
 *
 * The parent page starts it through window.__brinkTour.start().
 */
(function () {
  "use strict";

  /* eslint-disable */
  // === TOUR CONTENT =========================================================
  // Based on WALKTHROUGH_SPEC.md §3, since amended on request:
  //   - order follows the nav: Live State's steps, then Ask Brink,
  //     Interventions, Signal Studio, Capacity Profile, Device;
  //   - the spec's 'timeline' step is gone with Session Timeline, and the
  //     line in step 06 that pointed at the Timeline was rewritten;
  //   - steps 07 and 08 (What Brink sees, Approaching your brink) are new;
  //   - em dashes removed throughout.
  const TOUR_STEPS = [
  { section: 'live', scenario: 'deepwork', target: 'device-status',
    kicker: 'Start here · the device',
    title: 'It is already reading you',
    body: 'Seven dry EEG channels across the forehead, an optical heart sensor, skin conductance and motion. Everything you see downstream is 96 milliseconds behind your actual body.',
    life: '9:02 AM. You clip the band on before your first meeting. By the time your laptop wakes, Brink has loaded 38 days of your own baselines and is comparing this morning against them.' },

  { section: 'live', scenario: 'meditation', target: 'scenario-switch',
    kicker: 'Orientation · scenarios',
    title: 'Five real situations, one interface',
    body: 'Deep work, meditation, running, strength, and the hour after a reset. Switching one does not change a theme. It changes which signals matter, what the numbers mean, and what Brink asks of you.',
    life: 'You meditate at 7:14 AM, run at 12:40, and write specs until 6. Same headband, three completely different bodies. The dashboard follows you between them without being told.' },

  { section: 'live', scenario: 'deepwork', target: 'goal-input',
    kicker: 'Goals · planning',
    title: 'You say what you want; it plans around your dips',
    body: 'Type a goal in plain words. Brink breaks it into equal units and pre-places two 90-second resets at the two times of day you historically fade.',
    life: 'You type "Read 15 pages by 5 PM". Brink parks a reset at 2:40 and another at 4:05, the exact two moments your blink rate has crept up on every long reading day this month.' },

  { section: 'live', scenario: 'deepwork', target: 'goal-rows',
    kicker: 'Goals · reading them',
    title: 'One cell equals one real thing',
    body: 'A cell is a page, a morning, or a day, never an abstraction. Filled means done, gold is where you are right now, an outline is missed or still scheduled. The caption always states the unit.',
    life: '3:38 PM: nine cells dark, the tenth gold. Page 10 of 15, done by 4:47 with 13 minutes of slack. You missed Tuesday’s meditation and it simply reads Holding, a streak of 9 rather than a scolding.' },

  { section: 'live', scenario: 'deepwork', target: 'narrative',
    kicker: 'Live state · the read',
    title: 'Plain language before numbers',
    body: 'Brink states what is happening to you in one paragraph, then backs it with figures underneath. Every claim is relative to your own baseline, not a population average.',
    life: 'Instead of "HF-HRV 48 ms, frontal alpha 62%", you read: your attention is highly sustained, but strain will likely start rising in about 24 minutes.' },

  { section: 'live', scenario: 'deepwork', target: 'rec',
    kicker: 'Live state · what to do',
    title: 'Exactly one next action',
    body: 'Never a feed of advice. One intervention, timed to a specific minute, with the reason available on hover. It disappears entirely when nothing is needed.',
    life: '"90-second reset at 3:52." You take it between two calls. Twenty minutes later your strain is flat instead of climbing, and the afternoon never turns into a headache.' },

  { section: 'live', scenario: 'deepwork', target: 'factors',
    kicker: 'Live state · the evidence',
    title: 'Why it thinks that',
    body: 'Every estimate is broken into the factors behind it, ranked by how much each one moved the result. Switch to Technical for the underlying measure, or leave it in plain words.',
    life: 'You are told strain is rising. You open the factors: your blink rate is up 18 percent, your frontal channels have been drifting for 16 minutes, and stillness has held for over an hour. Three things you can act on, not a score.' },

  { section: 'live', scenario: 'deepwork', target: 'prediction',
    kicker: 'Live state · what is next',
    title: 'The decline before it happens',
    body: 'A projected curve for the next 40 minutes, with a shaded band for how sure Brink is. The band widens when the signals disagree, so you can see confidence drop rather than take a number on faith.',
    life: 'At 3:38 the curve crosses your threshold at about 4:02. You move the hard part of the task forward twenty minutes and finish it before the dip instead of pushing through it.' },

  { section: 'ask', scenario: 'deepwork', target: 'ask',
    kicker: 'Ask Brink',
    title: 'Ask about your own body',
    body: 'Questions answered from your data alone, with the signals behind the answer shown next to it. No generic wellness copy.',
    life: '"Can I train hard tonight?" Answer: yes, but keep it under 40 minutes. This morning’s HRV is 9 ms below your average and today already carries a full deep-work strain load.' },

  { section: 'interventions', scenario: 'postint', target: 'interv',
    kicker: 'Interventions',
    title: 'It tells you whether the fix worked',
    body: 'Each intervention carries an expected effect before you do it, and a measured effect after. Suggestions you ignore or that fail are kept, not hidden.',
    life: 'You did the 90-second breathing reset at 3:52. Twenty minutes later: HRV up 6 ms, blink rate back to baseline, projected decline pushed out 22 minutes. It worked, and you can see that it did.' },

  { section: 'signals', scenario: 'running', target: 'signals',
    kicker: 'The evidence',
    title: 'The raw signals, if you want them',
    body: 'Toggle any stream, switch EEG to raw, and see the segments Brink excluded. It shows you where it stopped trusting itself instead of quietly smoothing it over.',
    life: 'Mid-run you doubt the strain number. You open Signal Studio: head motion is 0.61 g, the frontal channels are full of artifact, and Brink has already down-weighted EEG and leaned on your heart data.' },

  { section: 'profile', scenario: 'deepwork', target: 'profile',
    kicker: 'Your profile',
    title: 'What you, specifically, are built for',
    body: 'Thirty-eight days of sessions turn into personal constants: your best cognitive window, how long you last, how fast you recover, and what reliably breaks you.',
    life: 'Brink learns your sharpest window is 9:40 to 11:30 AM and that accuracy drops after 112 minutes, so it stops proposing three-hour blocks and starts defending your mornings.' },

  { section: 'device', scenario: 'running', target: 'device',
    kicker: 'Trust',
    title: 'It admits what it cannot see',
    body: 'Fit quality per channel, latency, what each sensor actually measures, and on-device processing you can verify. Confidence drops out loud rather than being faked.',
    life: 'Your fit loosens at kilometre four. Brink names the two degraded channels, excludes them, and lowers its confidence from 87% to 72% instead of pretending it still knows.' }
];
  /* eslint-enable */

  // === ADAPTER =============================================================
  // The single place the section order matters (spec §3). The spec's section
  // keys are stable; our nav order is not, so resolve through the live names
  // array the dashboard renders from rather than through fixed indices.
  const SECTION_NAME = {
    live: "Live State",
    signals: "Signal Studio",
    interventions: "Interventions",
    profile: "Capacity Profile",
    ask: "Ask Brink",
    device: "Device",
  };

  function dash() {
    return window.__dash || null;
  }

  // Both drive the dashboard through the very closures its own buttons use,
  // so navigating the tour is indistinguishable from clicking the UI. That
  // also means the scenario can be set on sections whose switcher is hidden.
  function goToSection(key) {
    const d = dash();
    if (!d) return;
    const i = d.names.indexOf(SECTION_NAME[key]);
    if (i >= 0 && d.navItems[i]) d.navItems[i].go();
  }

  function setScenario(key) {
    const d = dash();
    if (!d) return;
    const i = d.scenarioKeys.indexOf(key);
    if (i >= 0 && d.scenarios[i]) d.scenarios[i].go();
  }

  // === STATE ===============================================================
  // Everything here is a closure variable. Nothing the dashboard re-renders
  // can reach it.
  let active = false;
  let idx = 0;
  let rect = null;
  let retryTimer = 0;
  let rafId = 0;
  let root = null;
  let els = null;

  const CW = 376;
  const CH = 356;

  const target = () =>
    document.querySelector('[data-tour="' + TOUR_STEPS[idx].target + '"]');

  // === MEASUREMENT =========================================================
  // Never scrollIntoView (spec §4): it scrolls every ancestor including the
  // marketing page hosting this iframe, which would yank the visitor away.
  function revealInContainer(el) {
    let p = el.parentElement;
    while (p) {
      const cs = getComputedStyle(p);
      if (
        /(auto|scroll)/.test(cs.overflowY) &&
        p.scrollHeight > p.clientHeight + 4
      ) {
        p.scrollTop +=
          el.getBoundingClientRect().top - p.getBoundingClientRect().top - 32;
        return;
      }
      p = p.parentElement;
    }
  }

  function commit(r) {
    const n = { t: r.top, l: r.left, w: r.width, h: r.height };
    if (
      rect &&
      Math.abs(rect.t - n.t) <= 0.5 &&
      Math.abs(rect.l - n.l) <= 0.5 &&
      Math.abs(rect.w - n.w) <= 0.5 &&
      Math.abs(rect.h - n.h) <= 0.5
    ) {
      return;
    }
    rect = n;
    draw();
  }

  // Retry until the target both exists and has a real box. Section swaps and
  // the dc-runtime's re-render are not synchronous, so the first look after a
  // navigation routinely finds nothing.
  function measureWithRetries() {
    clearTimeout(retryTimer);
    let tries = 0;
    let revealed = false;

    (function attempt() {
      if (!active) return;
      const el = target();
      if (el) {
        if (!revealed) {
          revealInContainer(el);
          revealed = true;
        }
        const r = el.getBoundingClientRect();
        if (r.width > 2 && r.height > 2) {
          commit(r);
          return; // the rAF watcher keeps it glued from here
        }
      }
      if (tries++ < 12) {
        retryTimer = setTimeout(attempt, 60);
      } else if (idx < TOUR_STEPS.length - 1) {
        go(idx + 1); // skip a missing target rather than ring nothing
      } else {
        stop();
      }
    })();
  }

  // Re-measure every frame while the tour is up. The explicit resize/scroll
  // listeners below are what the spec asks for; this additionally survives the
  // ~1s live re-render, which replaces the target node outright and so moves
  // the box without firing either event.
  function watch() {
    rafId = requestAnimationFrame(watch);
    if (!active || !rect) return;
    const el = target();
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) commit(r);
  }

  function onMove() {
    if (!active) return;
    const el = target();
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 2 && r.height > 2) commit(r);
  }

  function onKey(e) {
    if (!active) return;
    if (e.key === "Escape") stop();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
  }

  // === OVERLAY =============================================================
  function build() {
    root = document.createElement("div");
    root.className = "brink-tour-root";

    // Transparent click-catcher. The ring above carries the visible scrim but
    // is pointer-events:none, so this is what makes a backdrop click cancel.
    const backdrop = document.createElement("div");
    backdrop.setAttribute("aria-hidden", "true");
    backdrop.style.cssText = "position:fixed;inset:0;z-index:59";
    backdrop.addEventListener("click", stop);

    const ring = document.createElement("div");
    ring.setAttribute("aria-hidden", "true");
    ring.style.cssText =
      "position:fixed;z-index:60;pointer-events:none;" +
      "border:2px solid var(--color-accent);" +
      "box-shadow:0 0 0 9999px rgba(32,31,29,0.42)";

    const card = document.createElement("div");
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "tour-title");
    card.setAttribute("tabindex", "-1");
    card.style.cssText =
      "position:fixed;z-index:61;width:" +
      CW +
      "px;background:var(--color-bg);" +
      "border:2px solid var(--color-text);box-shadow:var(--shadow-lg);" +
      "font-family:var(--font-body);color:var(--color-text);outline:none";

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:14px 18px 0">' +
      '<div data-t="kicker" style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--color-accent)"></div>' +
      '<div data-t="count" style="font-size:10px;font-variant-numeric:tabular-nums;color:var(--color-neutral-600)"></div>' +
      "</div>" +
      '<div style="padding:6px 18px 0">' +
      '<div id="tour-title" data-t="title" style="font-family:var(--font-heading);font-weight:800;font-size:19px;line-height:1.15;letter-spacing:-0.01em;text-wrap:pretty"></div>' +
      '<p data-t="body" style="font-size:12.5px;line-height:1.55;margin:8px 0 0;color:var(--color-neutral-800);text-wrap:pretty"></p>' +
      "</div>" +
      '<div style="margin:14px 18px 0;border-top:1px solid var(--color-divider);padding-top:11px">' +
      '<div style="font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--color-neutral-500);margin-bottom:5px">In real life</div>' +
      '<p data-t="life" style="font-size:12.5px;line-height:1.55;margin:0;font-style:italic;text-wrap:pretty"></p>' +
      "</div>" +
      '<div style="display:flex;align-items:center;gap:8px;padding:14px 18px 16px">' +
      '<button type="button" data-t="end" aria-label="End the walkthrough" style="display:flex;align-items:center;gap:6px;border:1px solid var(--color-text);background:none;font:inherit;font-size:11px;font-weight:600;color:var(--color-text);cursor:pointer;padding:6px 11px">' +
      '<span aria-hidden="true" style="font-size:13px;line-height:1">\u2715</span>End tour</button>' +
      '<span style="font-size:9.5px;color:var(--color-neutral-500);margin-left:8px">or press Esc</span>' +
      '<div style="flex:1"></div>' +
      '<button type="button" data-t="back" class="btn btn-secondary" style="font-size:11.5px;padding:7px 12px">Back</button>' +
      '<button type="button" data-t="next" style="border:none;background:var(--color-accent);color:var(--color-bg);font:inherit;font-size:11.5px;font-weight:700;padding:8px 15px;cursor:pointer"></button>' +
      "</div>";

    root.appendChild(backdrop);
    root.appendChild(ring);
    root.appendChild(card);
    document.body.appendChild(root);

    const q = (n) => card.querySelector('[data-t="' + n + '"]');
    els = {
      ring,
      card,
      kicker: q("kicker"),
      count: q("count"),
      title: q("title"),
      body: q("body"),
      life: q("life"),
      back: q("back"),
      next: q("next"),
    };

    q("end").addEventListener("click", stop);
    els.back.addEventListener("click", prev);
    els.next.addEventListener("click", next);
  }

  function draw() {
    if (!active) return;
    if (!root) build();

    const step = TOUR_STEPS[idx];
    const total = TOUR_STEPS.length;
    const W = window.innerWidth;
    const H = window.innerHeight;

    els.kicker.textContent = step.kicker;
    els.count.textContent =
      String(idx + 1).padStart(2, "0") + " / " + String(total).padStart(2, "0");
    els.title.textContent = step.title;
    els.body.textContent = step.body;
    els.life.textContent = step.life;
    els.next.textContent = idx === total - 1 ? "Finish" : "Next";
    els.back.style.opacity = idx === 0 ? "0.35" : "1";

    let left;
    let top;
    if (rect) {
      els.ring.style.display = "block";
      els.ring.style.top = rect.t - 4 + "px";
      els.ring.style.left = rect.l - 4 + "px";
      els.ring.style.width = rect.w + 8 + "px";
      els.ring.style.height = rect.h + 8 + "px";

      // Measured, not the spec's fixed 356: these cards vary by ~40px with the
      // copy, and guessing high pushes short cards into a needless flip.
      const cardH = els.card.offsetHeight || CH;

      // Below, then above, then beside. The spec stops after above and clamps,
      // which lands the card ON a tall target — goal-rows is 393px, so neither
      // below nor above fits and the clamp pinned the card over the very rows
      // the step is describing.
      const fitsBelow = rect.t + rect.h + 14 + cardH <= H - 16;
      const fitsAbove = rect.t - 14 - cardH >= 16;
      const roomRight = W - (rect.l + rect.w) - 14 >= CW + 16;
      const roomLeft = rect.l - 14 >= CW + 16;

      if (fitsBelow) {
        top = rect.t + rect.h + 14;
        left = rect.l;
      } else if (fitsAbove) {
        top = rect.t - 14 - cardH;
        left = rect.l;
      } else if (roomRight) {
        left = rect.l + rect.w + 14;
        top = rect.t;
      } else if (roomLeft) {
        left = rect.l - CW - 14;
        top = rect.t;
      } else {
        // Nothing fits: sit on the bottom edge, which covers the target's
        // lower rows rather than its heading.
        top = H - 16 - cardH;
        left = rect.l;
      }

      left = Math.min(left, W - 16 - CW);
      top = Math.min(top, H - 16 - cardH);
    } else {
      // Only ever seen for the frames between navigating and measuring.
      els.ring.style.display = "none";
      left = (W - CW) / 2;
      top = Math.max(16, H - CH - 32);
    }

    els.card.style.left = Math.round(Math.max(16, left)) + "px";
    els.card.style.top = Math.round(Math.max(16, top)) + "px";
  }

  // === CONTROL =============================================================
  function go(n) {
    const bounded = Math.max(0, Math.min(TOUR_STEPS.length - 1, n));
    const first = !active;
    idx = bounded;
    active = true;
    rect = null;

    const step = TOUR_STEPS[idx];
    goToSection(step.section);
    setScenario(step.scenario);

    draw();
    measureWithRetries();

    if (first) {
      window.addEventListener("resize", onMove);
      window.addEventListener("scroll", onMove, true);
      window.addEventListener("keydown", onKey);
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(watch);
    }
    if (els) els.card.focus({ preventScroll: true });
  }

  function stop() {
    if (!active) return;
    active = false;
    rect = null;
    clearTimeout(retryTimer);
    cancelAnimationFrame(rafId);
    rafId = 0;
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove, true);
    window.removeEventListener("keydown", onKey);
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = null;
    els = null;
    // Leaves the visitor on whatever section they were reading (spec §4).
  }

  function next() {
    if (idx === TOUR_STEPS.length - 1) stop();
    else go(idx + 1);
  }

  function prev() {
    go(idx - 1);
  }

  window.__brinkTour = {
    start: function () {
      // Restart at step 0 if it is already running (spec §4).
      if (active) stop();
      go(0);
    },
    stop: stop,
    isActive: function () {
      return active;
    },
    steps: TOUR_STEPS.length,
  };
})();
