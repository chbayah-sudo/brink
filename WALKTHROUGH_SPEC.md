# Brink Dashboard — Guided Walkthrough + Hover Tooltips

Implementation spec for the interactive walkthrough and hover-explanation layer, written to be dropped into the **existing** embedded dashboard (whatever section order it now has).

---

## 0. Goals

1. **Hover popups** — any element can explain itself on hover via one attribute. No per-element component.
2. **Guided walkthrough** — a spotlight tour that, per step, navigates to the right section **and** the right demo scenario, dims the page, rings the element being described, and shows a card with (a) what the feature is and (b) a short *real-life* scenario.
3. **Entry point** — starts when the user clicks the existing **Explore demo** button.
4. **Exit** — cancellable at any time: "End tour" button, `Esc`, or clicking the dimmed backdrop. Ending restores normal browsing; nothing is left mounted.

Design language: Classical — Cormorant Garamond headings / Lora body, ground `--color-bg`, single gold accent `--color-accent`, color as stroke not fill, hairline dividers, no heavy shadows. Take every value from the CSS variables already in the app; do not hard-code hexes.

---

## 1. Anchors — `data-tour`

Steps find their target with `document.querySelector('[data-tour="<id>"]')`. **Section order is irrelevant** — that's the point of using ids instead of indices, so the rearranged layout keeps working.

Add these attributes to whatever elements now play these roles:

| `data-tour` | Put it on |
| --- | --- |
| `device-status` | Sidebar block with connection / fit / latency lines |
| `scenario-switch` | The scenario segmented control in the header |
| `goal-input` | The goal text input + "Plan it" button row |
| `goal-rows` | The container holding all goal rows |
| `narrative` | The plain-language state paragraph |
| `rec` | The single recommendation block |
| `timeline` | Timeline section's main container |
| `signals` | Signal Studio's stream-toggle bar (or its chart grid) |
| `interv` | Interventions section container |
| `profile` | Capacity Profile container |
| `ask` | Ask Brink container |
| `device` | Device section container |

Rules:
- One element per id, and it must be **visible when its step's section is active**.
- Prefer a container that frames the whole feature over a single line of text — the ring reads better.
- If a step's target no longer exists after a refactor, the tour must **skip that step**, never break (see §5).

---

## 2. Hover tooltips (CSS only)

Add once to the global stylesheet. Then `data-tip="…"` on anything makes it self-explaining. Use `&#10;` (or `\n` in JSX strings) for line breaks.

```css
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
/* flip when the element sits low or far right */
[data-tip-up]:hover::after  { top: auto; bottom: calc(100% + 7px); }
[data-tip-up]:hover::before { top: auto; bottom: 100%; border-bottom-color: transparent; border-top-color: var(--color-neutral-900); }
[data-tip-right]:hover::after  { left: auto; right: 8px; }
[data-tip-right]:hover::before { left: auto; right: 16px; }
```

Attach tips at minimum to: device status, scenario switcher, goal input, **each goal row's cell strip** (state the unit — "15 cells = 15 pages; nine read, gold is page 10"), the narrative, and the recommendation. Keep them 1–3 short lines; they explain *encoding*, not marketing.

---

## 3. Tour content

Ship exactly this copy. Field meanings: `section` = section id to navigate to, `scenario` = demo scenario key to activate, `target` = `data-tour` id.

```js
export const TOUR_STEPS = [
  { section: 'live', scenario: 'deepwork', target: 'device-status',
    kicker: 'Start here · the device',
    title: 'It is already reading you',
    body: 'Seven dry EEG channels across the forehead, an optical heart sensor, skin conductance and motion. Everything you see downstream is 96 milliseconds behind your actual body.',
    life: '9:02 AM. You clip the band on before your first meeting. By the time your laptop wakes, Brink has loaded 38 days of your own baselines and is comparing this morning against them.' },

  { section: 'live', scenario: 'meditation', target: 'scenario-switch',
    kicker: 'Orientation · scenarios',
    title: 'Five real situations, one interface',
    body: 'Deep work, meditation, running, strength, and the hour after a reset. Switching does not change a theme — it changes which signals matter, what the numbers mean, and what Brink asks of you.',
    life: 'You meditate at 7:14 AM, run at 12:40, and write specs until 6. Same headband, three completely different bodies — the dashboard follows you between them without being told.' },

  { section: 'live', scenario: 'deepwork', target: 'goal-input',
    kicker: 'Goals · planning',
    title: 'You say what you want; it plans around your dips',
    body: 'Type a goal in plain words. Brink breaks it into equal units and pre-places two 90-second resets at the two times of day you historically fade.',
    life: 'You type "Read 15 pages by 5 PM". Brink parks a reset at 2:40 and another at 4:05 — the exact two moments your blink rate has crept up on every long reading day this month.' },

  { section: 'live', scenario: 'deepwork', target: 'goal-rows',
    kicker: 'Goals · reading them',
    title: 'One cell equals one real thing',
    body: 'A cell is a page, a morning, or a day — never an abstraction. Filled means done, gold is where you are right now, an outline is missed or still scheduled. The caption always states the unit.',
    life: '3:38 PM: nine cells dark, the tenth gold. Page 10 of 15, done by 4:47 with 13 minutes of slack. You missed Tuesday’s meditation and it simply reads Holding — a streak of 9, not a scolding.' },

  { section: 'live', scenario: 'deepwork', target: 'narrative',
    kicker: 'Live state · the read',
    title: 'Plain language before numbers',
    body: 'Brink states what is happening to you in one paragraph, then backs it with figures underneath. Every claim is relative to your own baseline, not a population average.',
    life: 'Instead of "HF-HRV 48 ms, frontal alpha 62%", you read: your attention is highly sustained, but strain will likely start rising in about 24 minutes.' },

  { section: 'live', scenario: 'deepwork', target: 'rec',
    kicker: 'Live state · what to do',
    title: 'Exactly one next action',
    body: 'Never a feed of advice. One intervention, timed to a specific minute, with the reason available on hover — and it disappears when nothing is needed.',
    life: '"90-second reset at 3:52." You take it between two calls. On the Timeline that evening you can see the strain curve bend down before it ever became a headache.' },

  { section: 'timeline', scenario: 'deepwork', target: 'timeline',
    kicker: 'The day',
    title: 'Your whole day, scrubbable',
    body: 'Activities as bands, strain as a curve, and the moments Brink flagged as events. Drag the scrubber and the readout re-states what was true at that minute.',
    life: 'At 6 PM you drag back to 11:20 AM and see the peak of your run — and why today’s focus decline is developing more slowly than usual: this morning’s run improved your autonomic recovery.' },

  { section: 'signals', scenario: 'running', target: 'signals',
    kicker: 'The evidence',
    title: 'The raw signals, if you want them',
    body: 'Toggle any stream, switch EEG to raw, and see the segments Brink excluded. It shows you where it stopped trusting itself instead of quietly smoothing it over.',
    life: 'Mid-run you doubt the strain number. You open Signal Studio: head motion is 0.61 g, the frontal channels are full of artifact, and Brink has already down-weighted EEG and leaned on your heart data.' },

  { section: 'interventions', scenario: 'postint', target: 'interv',
    kicker: 'Interventions',
    title: 'It tells you whether the fix worked',
    body: 'Each intervention carries an expected effect before you do it, and a measured effect after. Suggestions you ignore or that fail are kept, not hidden.',
    life: 'You did the 90-second breathing reset at 3:52. Twenty minutes later: HRV up 6 ms, blink rate back to baseline, projected decline pushed out 22 minutes. It worked, and you can see that it did.' },

  { section: 'profile', scenario: 'deepwork', target: 'profile',
    kicker: 'Your profile',
    title: 'What you, specifically, are built for',
    body: 'Thirty-eight days of sessions turn into personal constants: your best cognitive window, how long you last, how fast you recover, and what reliably breaks you.',
    life: 'Brink learns your sharpest window is 9:40–11:30 AM and that accuracy drops after 112 minutes — so it stops proposing three-hour blocks and starts defending your mornings.' },

  { section: 'ask', scenario: 'deepwork', target: 'ask',
    kicker: 'Ask Brink',
    title: 'Ask about your own body',
    body: 'Questions answered from your data alone, with the signals behind the answer shown next to it — no generic wellness copy.',
    life: '"Can I train hard tonight?" Answer: yes, but keep it under 40 minutes — this morning’s HRV is 9 ms below your average and today already carries a full deep-work strain load.' },

  { section: 'device', scenario: 'running', target: 'device',
    kicker: 'Trust',
    title: 'It admits what it cannot see',
    body: 'Fit quality per channel, latency, what each sensor actually measures, and on-device processing you can verify. Confidence drops out loud rather than being faked.',
    life: 'Your fit loosens at kilometre four. Brink names the two degraded channels, excludes them, and lowers its confidence from 87% to 72% instead of pretending it still knows.' }
];
```

Map `section` strings to whatever the app now uses (route, index, tab key) in **one** adapter function — that's the only place the rearranged order matters.

---

## 4. Behaviour

**Start** — clicking **Explore demo** starts the tour at step 0. It should also set the scenario and section for that step. If the tour is already running, the button restarts it at step 0.

**Per step:** navigate → wait for the target to exist and have a non-zero box → scroll it into view inside its own scroll container → measure → draw ring + card.

**Spotlight ring:** a `position: fixed` box at the target rect inflated 4px, `2px solid var(--color-accent)`, and the scrim done as `box-shadow: 0 0 0 9999px rgba(32,31,29,0.42)` so there is a real hole over the target. `pointer-events: none`, `z-index: 60`.

**Card:** `position: fixed`, 376px wide, `z-index: 61`, `background: var(--color-bg)`, `2px solid var(--color-text)`, `--shadow-lg`. Placed below the target, flipped above when it would overflow the viewport bottom, clamped 16px from every edge. Left edge aligns to the target's left. Contents, in order: gold uppercase kicker + tabular step counter (`03 / 12`); serif title; body paragraph; hairline rule; `IN REAL LIFE` label with the scenario in italics; footer with "End tour" (ghost, left) and Back / Next (Next becomes **Finish** on the last step). Back is dimmed to 35% opacity on step 0.

**Cancel:** "End tour", `Esc`, and clicking the backdrop all end it. On end: unmount overlay, remove listeners, leave the user on the section they're viewing (don't yank them back).

**Robustness (this is where the first implementation failed):**
- Keep the measured rect **out of any state that a periodic re-render can clobber** — the dashboard re-renders ~1/s from its live loop. Store it in a ref and force one update, or measure in a layout effect keyed on step.
- **Retry** measurement (~12 × 60ms) until the target exists and has width/height > 2 — section swaps and canvas mounts are not synchronous.
- **Re-measure** on `resize` and on `scroll` (capture phase, so inner scroll containers count).
- Never call `scrollIntoView` — adjust the scroll container's `scrollTop` directly (`scrollTop += targetTop - containerTop - 32`).
- If a target is missing after retries, skip to the next step rather than showing an unanchored ring.

**Accessibility:** card is `role="dialog" aria-modal="true"` with `aria-labelledby` on the title; focus moves to the card on each step; `Esc` closes; Next/Back reachable by keyboard; ring is `aria-hidden`.

---

## 5. Reference implementation (React — adapt to the app's patterns)

```jsx
// useTour.js
import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { TOUR_STEPS } from './tourSteps';

export function useTour({ goToSection, setScenario }) {
  const [active, setActive] = useState(false);
  const [i, setI] = useState(0);
  const rect = useRef(null);
  const [, bump] = useState(0);
  const redraw = () => bump(n => n + 1);

  const go = useCallback((n) => {
    const step = TOUR_STEPS[Math.max(0, Math.min(TOUR_STEPS.length - 1, n))];
    rect.current = null;
    setI(TOUR_STEPS.indexOf(step));
    setActive(true);
    goToSection(step.section);
    setScenario(step.scenario);
  }, [goToSection, setScenario]);

  const stop = useCallback(() => { rect.current = null; setActive(false); }, []);

  // measure with retries; rect lives in a ref so the 1s live-data re-render can't clobber it
  useLayoutEffect(() => {
    if (!active) return;
    let tries = 0, timer;
    const measure = () => {
      const step = TOUR_STEPS[i];
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (!el) {
        if (tries++ < 12) timer = setTimeout(measure, 60);
        else if (i < TOUR_STEPS.length - 1) go(i + 1);       // skip a missing target
        return;
      }
      if (tries === 0) {
        let p = el.parentElement;
        while (p) {
          const cs = getComputedStyle(p);
          if (/(auto|scroll)/.test(cs.overflowY) && p.scrollHeight > p.clientHeight + 4) {
            p.scrollTop += el.getBoundingClientRect().top - p.getBoundingClientRect().top - 32;
            break;
          }
          p = p.parentElement;
        }
      }
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { if (tries++ < 12) timer = setTimeout(measure, 60); return; }
      const next = { t: r.top, l: r.left, w: r.width, h: r.height }, o = rect.current;
      if (!o || ['t','l','w','h'].some(k => Math.abs(o[k] - next[k]) > 0.5)) { rect.current = next; redraw(); }
      if (tries++ < 4) timer = setTimeout(measure, 120);     // settle after transitions
    };
    measure();
    const onMove = () => { tries = 9; measure(); };
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => { clearTimeout(timer); window.removeEventListener('resize', onMove); window.removeEventListener('scroll', onMove, true); };
  }, [active, i, go]);

  useEffect(() => {
    if (!active) return;
    const onKey = e => { if (e.key === 'Escape') stop();
      if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, i, go, stop]);

  return {
    active, index: i, step: TOUR_STEPS[i], total: TOUR_STEPS.length, rect: rect.current,
    start: () => go(0), stop,
    next: () => (i === TOUR_STEPS.length - 1 ? stop() : go(i + 1)),
    prev: () => go(i - 1)
  };
}
```

```jsx
// Tour.jsx — render at the app root, once
export function Tour({ tour }) {
  if (!tour.active) return null;
  const { rect: r, step, index, total } = tour;
  const CW = 376, CH = 356, W = window.innerWidth, H = window.innerHeight;
  let left, top;
  if (r) {
    top = r.t + r.h + 14;
    if (top + CH > H - 16) top = Math.max(16, r.t - CH - 14);
    left = Math.min(r.l, W - 16 - CW);
  } else { left = (W - CW) / 2; top = Math.max(16, H - CH - 32); }

  return (
    <>
      <div aria-hidden onClick={tour.stop} style={r ? {
        position:'fixed', zIndex:60, top:r.t-4, left:r.l-4, width:r.w+8, height:r.h+8,
        border:'2px solid var(--color-accent)', boxShadow:'0 0 0 9999px rgba(32,31,29,0.42)'
      } : { position:'fixed', inset:0, zIndex:60, background:'rgba(32,31,29,0.42)' }} />

      <div role="dialog" aria-modal="true" aria-labelledby="tour-title" style={{
        position:'fixed', zIndex:61, left:Math.round(left), top:Math.round(top), width:CW,
        background:'var(--color-bg)', border:'2px solid var(--color-text)', boxShadow:'var(--shadow-lg)'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,padding:'14px 18px 0'}}>
          <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--color-accent)'}}>{step.kicker}</div>
          <div style={{fontSize:10,fontVariantNumeric:'tabular-nums',color:'var(--color-neutral-600)'}}>
            {String(index+1).padStart(2,'0')} / {String(total).padStart(2,'0')}
          </div>
        </div>
        <div style={{padding:'6px 18px 0'}}>
          <div id="tour-title" style={{fontFamily:'var(--font-heading)',fontWeight:800,fontSize:19,lineHeight:1.15,letterSpacing:'-0.01em',textWrap:'pretty'}}>{step.title}</div>
          <p style={{fontSize:12.5,lineHeight:1.55,margin:'8px 0 0',color:'var(--color-neutral-800)',textWrap:'pretty'}}>{step.body}</p>
        </div>
        <div style={{margin:'14px 18px 0',borderTop:'1px solid var(--color-divider)',paddingTop:11}}>
          <div style={{fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--color-neutral-500)',marginBottom:5}}>In real life</div>
          <p style={{fontSize:12.5,lineHeight:1.55,margin:0,fontStyle:'italic',textWrap:'pretty'}}>{step.life}</p>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'14px 18px 16px'}}>
          <button onClick={tour.stop} style={{border:'none',background:'none',font:'inherit',fontSize:11,color:'var(--color-neutral-600)',cursor:'pointer',padding:'6px 0'}}>End tour</button>
          <div style={{flex:1}} />
          <button onClick={tour.prev} className="btn btn-secondary" style={{fontSize:11.5,padding:'7px 12px',opacity:index===0?0.35:1}}>Back</button>
          <button onClick={tour.next} style={{border:'none',background:'var(--color-accent)',color:'var(--color-bg)',font:'inherit',fontSize:11.5,fontWeight:700,padding:'8px 15px',cursor:'pointer'}}>
            {index===total-1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
```

Wire-up:

```jsx
const tour = useTour({ goToSection, setScenario });   // both already exist in the dashboard
<button onClick={tour.start}>Explore demo</button>
<Tour tour={tour} />
```

---

## 6. Acceptance checklist

- [ ] "Explore demo" starts the tour at step 01 and lands on the correct section + scenario.
- [ ] Each of the 12 steps rings its actual element — never a full-screen scrim (that's the failure mode; check the ring has a non-zero width and a `box-shadow` present).
- [ ] Card flips above the target near the viewport bottom and never overflows any edge.
- [ ] Back / Next / Finish, `Esc`, and backdrop click all behave; Back dimmed on step 01.
- [ ] Ring stays glued to its target while resizing the window and scrolling the content area.
- [ ] Tour survives the ~1s live-data re-render without the ring dropping out.
- [ ] Hover tips appear on the seven anchor elements, flip up/right near edges, and read as encoding explanations.
- [ ] No console errors; no `scrollIntoView` anywhere.
