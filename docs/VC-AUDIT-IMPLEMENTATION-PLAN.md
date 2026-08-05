# Brink — VC Audit Implementation Plan

Source audit: [`BRINK-VC-WEBSITE-AND-DEMO-AUDIT-2026-08-05.md`](../BRINK-VC-WEBSITE-AND-DEMO-AUDIT-2026-08-05.md)
Plan authored: 2026-08-04 · Owner: engineering

**Governing constraint:** the site's authored visual identity is an asset, not a liability. The audit's own verdict is *"Do not replace the site's identity. Replace its order of revelation."* Every task below is additive or a copy/ordering change. Nothing in this plan converts Brink into a generic SaaS layout: no floating cards, no gradient glass, no white background, no rounded corners (`--radius: 0rem` is load-bearing), no palette change.

---

## 0. Architecture facts that constrain every task

These were verified against the code before planning. Several contradict the audit; where they do, this plan follows the code.

| # | Fact | Consequence for the plan |
|---|---|---|
| A1 | `scripts/build-demo.mjs` is **not** wired into `next build` (`package.json:9` is a bare `next build`; `vercel.json` sets no `buildCommand`). `public/demo/index.html` is committed and copied verbatim into `out/`. | Editing `public/demo/index.html` by hand *works* but silently forks it from the generator. **Rule: every demo change is a new `patch()` call in `scripts/build-demo.mjs`, followed by `node scripts/build-demo.mjs`.** |
| A2 | `build-demo.mjs` uses `patch()` with a strict "expected exactly 1 anchor" assertion (`:41-46`). 22 such calls exist. | Any re-layout of the demo invalidates several anchors at once and throws at build time. This is a feature — it prevents silent drift — but it means demo re-layout (Phase 2) and demo responsive work (Phase 3) must be sequenced, not parallelised. |
| A3 | `src/components/about.tsx` is **dead code** — not imported by `src/app/page.tsx`. | `"Fatigue is a decision, not a limit"` and `"Your prefrontal cortex calls it before your body is actually done"` **do not ship today.** They are a latent landmine, not a live claim. Fixed cheaply in Phase 1, not treated as a P0. |
| A4 | fNIRS appears **exactly once** in the whole repo: `src/components/writing.tsx:34`. | P0.4 is a one-sentence edit. The audit's quoted string `"EEG, fNIRS, HRV, and physiological signals"` does not exist; it paraphrased. The contradiction itself is real. |
| A5 | The demo's template runtime has **no `:d` / `:x` binding syntax.** Its escape hatch is the `sc-camel-` prefix, already used in the file for `sc-camel-view-box`, `sc-camel-auto-play`. | P0.6's suggested fix is wrong for this runtime. The correct fix is a counted `sc-camel-*` rewrite. See Task 3.1. |
| A6 | Reduced motion **is** handled — by JS `matchMedia` in 11 components. What is absent is CSS-level handling. | P1.7's premise ("neither route contains a `prefers-reduced-motion` media query") is literally true and materially misleading. The real gaps are three, not "everything": `footer-brain-video.tsx`, the demo's `blink 2.4s infinite`, and the absence of a CSS backstop. |
| A7 | `THREE.Clock` does not appear in `src/`. The deprecation warning comes from `@react-three/fiber`'s internals against `three` r185. | Not fixable in app code. Documented as accepted in Phase 4, not scheduled as work. |
| A8 | The demo's Session Timeline block (`public/demo/index.html:553-606`) is **unreachable** — `showTimeline` tests for a section name absent from `names` (`:1176`). | ~95 lines of dead template + logic. Decision required in Phase 2. It contains the demo's only abstain language, which P1.1 explicitly asks for. |
| A9 | **There is no test suite.** No runner, no CI, no `test` script. Quality gates are exactly `bun run lint` (= `bunx tsc --noEmit && next lint`) and `bun run build`. | Every acceptance criterion below is either a static grep, a build assertion, or a manual browser check. No task may claim "tests pass" — there are none to pass. |
| A10 | Chrome is installed; **no browser-automation MCP is configured.** | Browser verification is manual via DevTools. Steps are spelled out per task. |

### Audit claims this plan declines to action

| Audit claim | Verdict | Reason |
|---|---|---|
| "Second science card positioned completely off-canvas" at 390×844 | **False positive — no work scheduled** | `featured-carousel.tsx:49-135` is a deliberate `snap-x snap-mandatory` carousel with `basis-full` mobile cards, working arrows and labelled dots. A screenshot tool sees card 2 off-viewport because that is what a carousel is. |
| "Errors recur after every scenario and tab change" (P0.6) | **Refuted — does not change the fix** | All 65 errors fire once, at document parse. React re-renders emit none. The acceptance criterion still stands at zero. |
| "Remove the deprecated `THREE.Clock` usage" (P1.8) | **Not actionable in this repo** | See A7. |
| Mobile demo failure applies to the homepage-embedded demo (P0.5) | **Refuted for that surface** | `app-demo.tsx:48,106,210` gates phones to an `[ Open the demo ]` link by design. The failure is real and total at `/demo/` opened directly. |
| `"Your brain has settled…"` → `"Frontal EEG features are stable relative to your recent baseline"` | **Declined as written** | The proposed replacement *is already* the technical string at `public/demo/index.html:947`, surfaced by the existing Simple/Technical toggle. Applying it would delete the plain-language layer and duplicate the technical one. Narrower fix scheduled in Task 2.3. |
| `Model confidence 87%` → three-fact sentence | **Declined as written** | `metaRows` renders a right-aligned two-column tabular strip (`:460-463`); three facts wrap badly. Split across two surfaces in Task 2.4. |

---

## Phase 1 — Investor comprehension and scientific trust

**Goal:** a skeptical investor landing cold knows what Brink is, what it does, and where the evidence stops — inside the first screen and the first scroll. All React source. No demo changes. Low blast radius.

**Status: ✅ COMPLETE** (see §Completion record)

---

### Task 1.1 — Hero rehierarchy

- **Audit finding:** P0.1 — "Make the company legible in the first screen." The hero prioritises mood over product, outcome and first interface. The mobile CTA reads only `OPEN` and is visually tiny.
- **Priority:** P0 — highest single-item leverage in the audit.
- **Files:** `src/components/hero.tsx` (lines 98-176)
- **Intended user-facing result:** Within one second of load, without waiting for an animation cycle, the visitor reads the category (`BRINK · HUMAN CAPACITY OS`), a headline stating the outcome, a subhead stating the loop and naming the headband, and two real calls to action. The full-bleed cinematic video treatment, the `BRINK` wordmark, and the four corner letters are unchanged.
- **Technical approach:**
  - Measured baseline: the positioning statement lives only in a `TypingAnimation` whose full cycle is 12.73 s, of which the sentence is fully legible for 1.8 s (**14%**), and which renders **empty on first paint**. The only CTA is a 4-character `Open` anchor at `mono-label` (10px) pointing at `#brain`.
  - Insert a gradient scrim between the `<video>` and the overlay so 15px body copy survives over the ASCII footage. Uses the site's own established device (identical in kind to `ascii-brain.tsx:942-945`).
  - Insert into the centre stack, top to bottom: static eyebrow → wordmark → static `<h1>` headline → static subhead.
  - Demote the wordmark from `<h1>` to `<div aria-hidden>` (it is a logotype, already announced by the header link) and the `TypingAnimation` from `as="h1"` to `as="p"`, leaving exactly one `<h1>` containing the proposition. **Fixes an existing two-`<h1>` bug.**
  - Replace the `[ GUI │ ▦ │ Open ]` pill with two `min-h-[44px]` CTAs: primary amber fill, secondary hairline-bordered — both existing site treatments.
  - **Deviation from the audit, deliberate:** the audit prescribes primary `WATCH THE CLOSED LOOP` → and the natural target `#how-brink-works` is the *device architecture* explorer (Frontal Sensing / Internal Architecture / Signal Intelligence / Safety Intelligence), not the closed loop. Pointing a "closed loop" label at it would be a fresh mislabel of exactly the kind P0.7 flags elsewhere. Shipped instead: primary `SEE THE CLOSED LOOP` → `#app` (the demo genuinely shows detect → forecast → act → learn), secondary `INSIDE THE HEADBAND` → `#how-brink-works`.
  - Do **not** touch the video `src`, `playbackRate = 2`, the IntersectionObserver pause, or the reduced-motion pause. `HERO_SRC_DEFAULT` is shared with `ascii-brain.tsx:889` and `src/lib/hero-src.ts:3` documents that both must sample identical frames for the shred handoff.
- **Acceptance criteria:**
  1. With JS disabled, or on first paint before any animation, the eyebrow, headline, subhead and both CTAs are fully readable.
  2. Exactly one `<h1>` in the hero, and it contains the proposition (not the wordmark).
  3. Both CTAs have a ≥44px touch target and resolve to existing section ids.
  4. The word "headband" appears in the hero.
  5. At 390×844 the whole stack fits within `100svh` with no clipping and no horizontal overflow.
  6. The hero video still autoplays on desktop, still pauses off-screen, still stays paused under reduced motion.
- **Dependencies:** none. First task in the phase.
- **Verification:** `bun run lint`; `bun run build`; serve `out/` and inspect at 1440×900 and 390×844 in Chrome; `document.querySelectorAll('#home h1').length === 1`; DevTools → Rendering → emulate `prefers-reduced-motion: reduce`, confirm hero video `.paused === true`.

---

### Task 1.2 — Resolve the fNIRS contradiction and rewrite the SCIENCE opener

- **Audit finding:** P0.4 — the homepage claims fNIRS; the Device screen does not list it. "A major diligence trigger." Plus P0.3's science-opener rewrite.
- **Priority:** P0.
- **Files:** `src/components/writing.tsx` (lines 31-36)
- **Intended user-facing result:** The modality list on the homepage matches, item for item, what the Device screen enumerates. The opener states an early-warning hypothesis under test rather than an implemented certainty, and says so in the site's own mono-metadata register rather than by hedging the serif line.
- **Technical approach:**
  - **Audit option 3 (remove from product copy) is the only defensible choice**, and this is falsifiable from Brink's own Device screen: `public/demo/index.html:1329-1336` enumerates seven sensors (Frontal EEG Fp1, Frontal EEG Fp2, contact-quality array, skin temperature, haptic actuator, optical PPG, IMU 6-axis) and Signal Studio's stream set (`:1256`) is `EEG, PPG, HRV, EDA, IMU, Resp`. There is **no emitter, detector, wavelength, source-detector separation, HbO/HbR trace or optical-coupling metric anywhere in the product.** Option 1 would require inventing an optical subsystem to support one word. Option 2's benchmarking sentence is truthful only if such benchmarking is planned, and it belongs in a validation section that does not yet exist — never in the same sentence as a product claim, which is precisely the ambiguity a diligence question probes.
  - Replace the sentence, and add a mono maturity line beneath using the existing `mono-label` span pattern already at `writing.tsx:28`.
- **Acceptance criteria:**
  1. `grep -ri fnirs src/` returns zero hits.
  2. Every modality named on the homepage is present in the demo's Device sensor list.
  3. The opener no longer asserts that breakdown "announces itself in the brain" as universal fact.
  4. A maturity qualifier is visible in the section without hedging inside the display serif.
- **Dependencies:** none.
- **Verification:** `grep -ri fnirs src/ public/demo/`; visual check of the SCIENCE section at both viewports.

---

### Task 1.3 — Repair the science cards and make citations traceable

- **Audit finding:** P0.3 — "Several statements currently convert suggestive research into universal or mechanistic certainty." Specifically `The tank is never empty.`, `The limit was set by the brain, not the muscle.`, `Exhaustion isn't your muscles failing…`, `Brink reads that decision and hands the reserve back.`, and the untraceable `Marcora, psychobiological model (2009)`.
- **Priority:** P0.
- **Files:** `src/lib/data.ts` (lines 1-36)
- **Intended user-facing result:** The two SCIENCE cards state what the studies found — with n and real numbers — rather than what the findings might imply. Each citation is a clickable DOI. The cards read *more* confident, not less, because they now carry specifics.
- **Technical approach:**
  - `The tank is never empty.` → `The tank was not empty.` Present-universal becomes past-particular. One word; kills the universal law, keeps the punch.
  - Card 1 excerpt carries the audit's own cited figures (ten participants, 242 W task power, 731 W immediately after, ≈3×) and drops `"The limit was set by the brain, not the muscle"` — mechanistic certainty the abstract does not support. `Brink lives in that gap` survives: it claims nothing and is the best sentence on the card.
  - Card 1 category `THE RESERVE` → `THE FINDING`. Once "hands the reserve back" is removed everywhere else, a label asserting a measurable reserve reintroduces the claim through the back door. The `Article["category"]` union type updates with it.
  - Card 2 title `Effort is a decision.` **kept verbatim** — Pageaux 2014 is literally titled *"An Effort-Based Decision-Making Theory."* This is the one flagged line the cited evidence fully supports.
  - Card 2 excerpt drops prefrontal-cortex localisation (unsupported, and unestablishable by a 7-channel frontal dry array) and `hands the reserve back` (a safety claim, not merely a science claim). Replacement ends `Brink reads the inputs, not the verdict` — the honest claim boundary stated as a slogan.
  - `Marcora, psychobiological model (2009)` → Pageaux 2014 with DOI, per the audit.
  - Both `href` values are currently `#writing` — the cards link to their own section while already carrying `target="_blank" rel="noreferrer"` (`featured-carousel.tsx:54-55`). Point them at the DOIs.
  - **The audit's own replacement prose is declined.** `"Perceived effort helps shape endurance limits. In a small study of ten fit men…"` is correct and unusable — it is a textbook abstract set in a 20px editorial serif. Same boundary, wrong register. The numbers carry it instead.
- **Acceptance criteria:**
  1. No claim of a universal brain-set limit, no single-region mechanism, no "reserve" that Brink hands back.
  2. Both citations name journal and DOI and link to `doi.org`.
  3. Reported figures match the audit's cited abstract exactly (10 participants, 242 W, 731 W, ≈3×).
  4. `bunx tsc --noEmit` passes with the changed category union.
- **Dependencies:** none.
- **Verification:** `bun run lint`; open the SCIENCE carousel and click each card, confirming it resolves to the correct DOI.

---

### Task 1.4 — Promote signal quality from marketing claim to credibility asset

- **Audit finding:** P0.3 boundary discipline, plus "What should be preserved §5": *"Signal Studio's raw-versus-cleaned EEG, motion-artifact exclusion, channel quality, and confidence concepts are among the most credibility-building parts of the product. Elevate them."*
- **Priority:** P0 (copy), low effort.
- **Files:** `src/components/brink-system-explorer.tsx` (Signal Intelligence description, and the Frontal Sensing description)
- **Intended user-facing result:** The marketing copy stops promising a mythical clean signal and starts promising the thing the product actually does — exclude bad data and say so.
- **Technical approach:**
  - `"Sweat, movement, and noise get filtered out. What's left is one clean read on your state."` asserts the *opposite* of the demo's own strongest behaviour: `public/demo/index.html:1496` excludes a 4.8 s Fp1/Fp2 segment, weights other streams up, and drops `cleanConf` to `'72%'` (`:1499`). Replace with copy that promises a read *with its confidence attached*.
  - `"Sensors sit where effort begins."` localises effort generation to the forehead — the same error class as the prefrontal-cortex line. Reword to describe placement, not mechanism.
  - `"Some limits are mental. Some are real. BRINK is built to know the difference, and when to back off."` (Safety Intelligence) is **kept verbatim** and used as the register benchmark for every rewrite in this phase: terse, confident, correctly scoped.
- **Acceptance criteria:** neither description asserts a mechanism the sensors cannot establish; the Signal Intelligence copy references confidence or exclusion; Safety Intelligence is byte-identical to before.
- **Dependencies:** none.
- **Verification:** `bun run lint`; scroll `#how-brink-works` and read all four steps.

---

### Task 1.5 — Defuse the dead THESIS copy

- **Audit finding:** P0.3 flags `Fatigue is a decision, not a limit` / `Your prefrontal cortex calls it before your body is actually done` / `hands the reserve back`.
- **Priority:** P1 — **not** P0, because per A3 this file does not render.
- **Files:** `src/components/about.tsx`
- **Intended user-facing result:** None today. This is landmine removal: if the component is ever reinstated, it will not reintroduce the exact claims this phase just removed elsewhere.
- **Technical approach:** Keep `Your brain quits first.` — a slogan under an explicit `THESIS` header that asserts no mechanism once the body copy stops naming one. Keep `Fatigue is a decision, not a limit.` — it is a compression of a named theory, framed as a position. Replace the mechanism sentence and the reserve claim. Add a header comment recording that the component is not currently mounted.
- **Acceptance criteria:** no prefrontal-cortex mechanism claim, no "reserve" claim; file still type-checks; `page.tsx` unchanged (the component stays unmounted — reinstating it is a separate decision, deferred to Phase 5).
- **Dependencies:** none.
- **Verification:** `bunx tsc --noEmit`; `grep -n "About" src/app/page.tsx` returns nothing (confirming it remains unmounted).

---

### Task 1.6 — Open Graph and Twitter metadata

- **Audit finding:** P1.6 — "Has no Open Graph or Twitter title, description, or image metadata."
- **Priority:** P1, promoted into Phase 1 because the surface it fixes is *the investor intro email*. A link to `neurabrink.bio` pasted into Slack, WhatsApp or Gmail currently previews as a bare URL.
- **Files:** `src/app/layout.tsx`; new `public/og.jpg`
- **Intended user-facing result:** Sharing the site anywhere renders a card with the headband image, the company name and the positioning line.
- **Technical approach:**
  - Static export means relative OG URLs do not resolve. `metadataBase: new URL("https://www.neurabrink.bio")` is required, not optional.
  - No 1200×630 asset exists. Derive one with `sips` from `public/media/state-sensing.jpg` (185 KB, an athlete wearing the headband) — on-brand, already licensed for the site, and the only asset that shows the product on a head.
  - Add `openGraph` (type, url, siteName, title, description, images) and `twitter` (`summary_large_image`). Reuse the existing `description` so there is one source of truth.
- **Acceptance criteria:**
  1. `grep -E 'og:|twitter:' out/index.html` returns non-empty.
  2. `og:image` is an absolute `https://` URL.
  3. The generated image is exactly 1200×630 and under 300 KB.
- **Dependencies:** none.
- **Verification:** `bun run build` then grep `out/index.html`; confirm image dimensions with `sips -g pixelWidth -g pixelHeight`.

---

## Phase 2 — Dashboard hierarchy and product narrative

**Goal:** the demo opens on the operating loop, and every number in it is defined. **All work routes through `scripts/build-demo.mjs` per A1/A2.** Highest-cascade phase in the plan.

**Status: ✅ COMPLETE** (see §Phase 2 completion record)

### Task 2.1 — Live State opens on NOW / FORECAST / ACTION / LEARNING; Goals demoted
- **Audit finding:** P0.2. **Priority:** P0.
- **Files:** `scripts/build-demo.mjs` (new patches, and repair of the existing `goal-input` / `goal-rows` anchors at `:231-250`), `scripts/demo-tour.js` (steps 03-04 at `:39-50`), regenerated `public/demo/index.html`, possibly `src/components/app-demo.tsx:138` if the step count changes.
- **Intended user-facing result:** The first demo viewport completes the sentence *"Brink sees this, predicts this, will do this, and learns this"* — instead of opening on three goal trackers that make a neurotech company look like a habit app.
- **Technical approach:** **This is ~75% re-ordering, ~25% build.** NOW, FORECAST and ACTION are already-bound values scattered across the current layout (`narrative` `:456`, `metaRows` `:458`, `rec` `:466`, `dims` `:475`, `factors` `:488`, prediction `:512`). LEARNING is the one genuine build — but its data already exists too (`ivResults` `:1502`, `ivLib` weights `:1504-1509`, the `0.62 → 0.71` selection-weight bar `:683-695`). No new modelling, no new state. Goals collapses to a one-line header strip (`GOAL · Read 15 pages by 5 PM · page 10 of 15 · on pace for 4:47`) built from values `goalRows` already exposes, and the full planner moves to Capacity Profile — where **a substantially richer planner already exists in logic and has never been rendered** (`coachMsg`, `coachWhy`, `coachActions`, `goalLessons`, nine authored variants at `:1360-1405`).
- **Acceptance criteria:** four labelled modules above the fold at 1440×900; Goals occupies ≤1 line in Live State; `node scripts/build-demo.mjs` completes with all anchors matching; the tour runs end to end with no skipped step.
- **Dependencies:** must land before Task 3.2 (mobile stacking) — the responsive rules target the post-restructure grid.
- **Verification:** manual walkthrough of all 6 sections × 5 scenarios; zero console errors.

### Task 2.2 — Scenario-correct chart labels and axes
- **Audit finding:** P0.7. **Priority:** P0.
- **Files:** `scripts/build-demo.mjs` → `public/demo/index.html` (`:532`, `:533`, `:539`, `:1210`, and the `pred` objects in `SCEN()` at `:940-1017`).
- **Intended user-facing result:** No chart label contradicts what the chart plots.
- **Technical approach:** Three labels are static in the template while the quantity is per-scenario: `Estimated decline likelihood` (`:532`), `Your typical baseline` (`:533`), `Expected form of decline` (`:539`). **The defect is worse than the audit found:** the x-axis is hardcoded to 40 minutes for all five scenarios (`:1210`), so *strength* plots "wait 40 seconds" advice on a 40-minute axis with its optimal window at +16→+25 min, and *meditation*'s `~4 min` label sits at +11→+20 min. Add `legend`, `effectsLabel`, `axis:{span,unit}` and `event` to each `pred`; bind the three static strings; drive the grid from `P.axis`. **Strength additionally needs its curve moved** (`onset:.35`, `window:[.4,.62]` → ≈`.62`/`[.62,.80]`) — the only scenario where the chart is wrong rather than merely mislabelled. Deep work is correct today, which is exactly why the bug is invisible in development.
- **Acceptance criteria:** for each of the five scenarios, legend, effects heading and axis units are consistent with `predSub`.
- **Dependencies:** Task 2.1 (shared anchors).
- **Verification:** screenshot all five scenarios; check each legend against its `predSub`.

### Task 2.3 — Evidence grades replace causal language
- **Audit finding:** P1.2 + the P0.3 demo strings. **Priority:** P0 for the four loudest strings; P2 for full coverage.
- **Files:** `scripts/build-demo.mjs` → `public/demo/index.html` `:1302`, `:1317`, `:756`, `:1308`, `:1304`, `:947`, `:973`, `:988`, `:993`.
- **Intended user-facing result:** Nothing in the demo claims causality it cannot support, and the interface shows where on the evidence ladder each claim sits.
- **Technical approach:** Ship one chip per row reading `DERIVED · REPEATED PATTERN`, not two — the audit separately asks for `Measured/Derived/Inferred` and for the five-rung ladder; they are naturally ordered axes and combine at half the visual noise. `:1317` (`"not just correlation… it held when Brink controlled for sleep and workload"`) is a **stronger causal claim than the one the audit flagged** and is not in the audit — fix it too. Nothing in `ivLib` is randomised, so **nothing may display `RANDOMIZED PERSONAL EVIDENCE` or `EXTERNALLY VALIDATED`** — showing an unreachable top of the ladder is itself the credibility move. Narrow fix for `:947`: `"Your brain has settled…"` → `"Your attention rhythm has steadied and is holding."` (brain-as-agent is the only real defect; see the declined-claims table).
- **Acceptance criteria:** zero occurrences of "causal" as an assertion; every counterfactual labelled model-estimated; safety boundary present in the ACTION module (not inside the running narrative).
- **Dependencies:** Task 2.1 for the ACTION module's safety field.
- **Verification:** `grep -i causal public/demo/index.html`.

### Task 2.4 — Define every prediction
- **Audit finding:** P1.1. **Priority:** P1.
- **Files:** `scripts/build-demo.mjs` → `public/demo/index.html` `:598`, `:943/959/974/989`, the FORECAST module from Task 2.1.
- **Intended user-facing result:** `Model confidence 87%` becomes an interpretable statement with a target event, horizon, coverage and personal precedent.
- **Technical approach:** `metaRows` key → `Forecast confidence`; the qualifier ("Personalized on 38 days · signal coverage 96%") goes in the FORECAST body where there is room. `running` already models abstention correctly (`72% · motion-limited`, `:974`) — use it as the pattern. The demo's only explicit abstain sentence lives in the dead Timeline block (`:1240`) — revive that string into FORECAST regardless of the Timeline decision.
- **Acceptance criteria:** every displayed probability has a named target event and horizon adjacent to it; an abstain state exists.
- **Dependencies:** Task 2.1.
- **Verification:** manual read of all five scenarios.

### Task 2.5 — Product maturity legend
- **Audit finding:** P1.5. **Priority:** P1.
- **Files:** `scripts/build-demo.mjs` → `public/demo/index.html` `:392`, `:848`, header `:397-409`; `src/components/app-demo.tsx:152-154`.
- **Intended user-facing result:** Each surface declares whether it is a live prototype, simulated output, a research model or a planned capability.
- **Technical approach:** Move the chip out of the 216px sidebar into the main header. Header arithmetic at the 1440 design width: sidebar 216 leaves 1224; the busiest state (Live State) uses ≈724, leaving ≈500 for two 10px chips at ≈220. Fits. **Verifiable fact for the founder to sign off:** every number in the demo comes from hardcoded `SCEN()` tables and a deterministic PRNG (`:930`, `:936`) — the demo as shipped is 100 % simulated output; the chip's job is to state which capability *behind* each surface exists. Ask Brink is four hardcoded Q/A pairs (`:1294-1324`) and labelling it `PLANNED CAPABILITY` is stronger than letting a partner discover it by typing. Also fix `:848`, which still reads `Brink Prototype 04` after the sidebar was patched to `Headband · Connected` — the two surfaces already disagree. Site-side, drop the `hidden` on `app-demo.tsx:153` so the label survives on the viewport where the demo is least legible.
- **Acceptance criteria:** a maturity chip is visible on every section; `Prototype 04` and `Headband` do not both appear.
- **Dependencies:** Task 2.1 (header layout).
- **Verification:** visual, all six sections.

### Task 2.6 — Decisive visual hierarchy and single-meaning red
- **Audit finding:** P1.3. **Priority:** P1.
- **Files:** as Task 2.1 — **do not schedule independently.**
- **Technical approach:** `var(--color-accent)` currently means active-nav, selected-scenario, the status blink dot, every chart trace, and general emphasis. Reserve it for elevated risk and urgent intervention; move navigation and selection to a neutral treatment.
- **Dependencies:** Tasks 2.1, 2.5.

### Task 2.7 — Decide the fate of the dead Session Timeline
- **Audit finding:** none — discovered during this review (A8). **Priority:** P1.
- **Files:** `public/demo/index.html:553-606`, `:1212-1240`, `:1176`.
- **Technical approach:** Either delete ≈95 lines, or restore Timeline as a secondary-workspace "day" view by adding it to `names`. Restoring is preferable — the audit's recommended IA lists a day view under Secondary workspace, and the walkthrough already has a written Timeline step. Either way, rescue the abstain string at `:1240` into FORECAST (Task 2.4).
- **Dependencies:** Task 2.1.

### Deferred from Phase 2 — explicitly, with reasons
- **P1.4 new longitudinal moat charts.** The demo already answers *"what gets better"*: `±14.2 min at day 1 → ±4.1 min today` (`:773`), the prediction-error curve (`:768-772`), day-1→day-35 milestones (`:1514`). Relabel `Prediction error` → `Forecast error · decline onset` (cheap, Phase 5); build new series only if the underlying numbers exist.
- **Evidence chips on all ~22 factor rows across 5 scenarios.** Restructures every `factors` tuple in `SCEN()`. Task 2.3's four loud strings capture most of the trust benefit at ≈5 % of the cost.
- **P2.1 Ask Brink as a full evidence interface.** Genuine build on four hardcoded Q/A pairs. Labelling it `PLANNED CAPABILITY` (Task 2.5) buys the same honesty for one string.
- **P2.3 team/validation section and P2.4 investor route.** Real content decisions requiring founder input, not engineering.

---

## Phase 3 — Mobile usability and runtime correctness

**Goal:** `/demo/` is usable on a phone and emits zero console errors. **Status: not started.**

### Task 3.1 — Eliminate the 65 SVG console errors
- **Audit finding:** P0.6. **Priority:** P0.
- **Files:** `scripts/build-demo.mjs` (one counted transform) → `public/demo/index.html` (65 sites across 10 `<svg>` blocks: `478`, `515-530`, `560-581`, `629-631`, `660-663`, `700-707`, `742-751`, `768-771`, `809-821`).
- **Intended user-facing result:** A clean console, and no risk of unstable first frames or broken charts.
- **Technical approach:** **Root cause:** `parseDcDocument()` reads `dc.innerHTML`, so the template must be live DOM — the raw `{{ }}` markup ships inline inside `<x-dc>` (`:9`) and Blink's SVG parser validates it before any JS runs. **Fix:** rewrite strict geometry attributes (`d|x|y|x1|y1|x2|y2|width|height`) whose value contains `{{` to the `sc-camel-` prefix. `kebabToCamel("x1") === "x1"`, so `sc-camel-x1` decodes to the React prop `x1` while the HTML parser validates nothing. **This is the runtime's documented encoding, already used in this very file** for `sc-camel-view-box` / `sc-camel-auto-play`. Dry-run confirmed: 65 rewrites, 0 strict placeholders left, 0 non-SVG elements touched, idempotent. Write it as a counted transform that throws unless the count matches, matching the file's existing assert-or-die discipline. **Do not use `:d`/`:x`** — that syntax does not exist in this runtime (A5). Paint attributes (`fill`, `stroke`) do not error and are left alone to keep the diff small.
- **Acceptance criteria:** `grep -cE '<(path|line|rect|text|circle|polyline|polygon|ellipse)\b[^>]*\s(d|x|y|x1|y1|x2|y2|width|height)="\{\{' public/demo/index.html` returns **0** (today: 65); DevTools error badge reads 0 on load and after all 6 tabs × 5 scenarios plus a full tour run.
- **Dependencies:** none technically, but land after Phase 2 to avoid re-running the transform over changed markup.
- **Verification:** the grep above, then the manual console protocol.

### Task 3.2 — Make `/demo/` usable at 390×844
- **Audit finding:** P0.5. **Priority:** P0.
- **Files:** `scripts/build-demo.mjs` (ride the existing `<style>` injection at `:333-360`) → `public/demo/index.html` `:367`, `:369`, `:396`, `:400-408`, and the seven fixed two-column grids at `:414`, `:554`, `:626`, `:672`, `:738`, `:794`, `:845`.
- **Intended user-facing result:** Every control reachable and every value legible on a phone.
- **Technical approach:** Confirmed root cause: **zero `@media` rules in the entire demo** — the only responsive rule is a `@container` at `:360`. The nav is `width:216px;flex:0 0 216px` + 2px border = 218px, leaving **172px** of a 390px viewport (audit said ~175 — immaterial), and `<main>` is `overflow:hidden` so content is clipped, not scrollable. Add a mobile stylesheet at the existing injection point: sidebar → top bar + drawer, scenario row → discoverable horizontal scroller, the seven `1fr 380px` grids → single column, `overflow:hidden` → `auto` under the breakpoint. Revisit `app-demo.tsx`'s `DESIGN_W = 1440` scaling once the demo is genuinely responsive, or phones will still see a shrunken desktop layout.
- **Acceptance criteria:** `document.documentElement.scrollWidth <= clientWidth`; no control's rect extends past `innerWidth`; all 6 sections and all 5 scenarios reachable by touch.
- **Dependencies:** Task 2.1 (targets the post-restructure grid).
- **Verification:** the DevTools console snippets in §Verification protocol.

### Task 3.3 — Demo document head and landmarks
- **Audit finding:** P1.6 (demo half). **Priority:** P1.
- **Files:** `scripts/build-demo.mjs` — the `<head>` splice at `:105-108`, plus `patch()` calls on `:2`, `:369`, `:383`, `:404`, `:852`.
- **Technical approach:** The `<head>` comes verbatim from the bundle; `build-demo.mjs` already splices into it at `:105-108`, which is exactly where `<title>`, `<meta name="description">` and OG tags belong. `lang` needs a separate asserting patch on `<html>` (`:2` carries no attributes today). Add `aria-label` to the nav, `aria-current` / `aria-pressed` threaded through the JS builders at `:1418+`, and a label on the Device video (`:852`). The demo has **4 `aria-*` attributes in 2005 lines** and zero `role=` today.
- **Acceptance criteria:** `grep -E '<html|<title|name="description"' out/demo/index.html` shows all three; the accessibility tree names the nav and exposes the active tab and scenario.

---

## Phase 4 — Performance, accessibility and reduced motion

**Status: not started.**

### Task 4.1 — Global `:focus-visible`
P1.6 · `src/app/globals.css`. **0 focus rules exist in 297 lines**; the only focus treatment in the repo is `preorder.tsx:149`, which also sets `outline-none`. Add one `:focus-visible` rule in the base layer using `--df-orange`. **Acceptance:** every interactive element shows a visible ring when tabbed; `preorder.tsx`'s existing treatment still wins on the email input.

### Task 4.2 — Decorative video labelling
P1.6 · `hero.tsx:100`, `ascii-brain.tsx:887/896/906`. Four of five `<video>` elements lack `aria-hidden`; `footer-brain-video.tsx:35` already has it (audit partly stale). All are decorative — none needs a real label.

### Task 4.3 — CSS reduced-motion backstop and the three real gaps
P1.7 · `src/components/footer-brain-video.tsx` (the **only** unguarded `<video>` in `src/` — `/footer-brain.mp4`, `loop`, started by an IO at `rootMargin:"60% 0px"`; this is the audit's "one looping video continued"); `src/app/globals.css` (unguarded infinite animations: `.marquee-track` 26 s, `.blink` 1.1 s); `scripts/build-demo.mjs` (the demo's `blink 2.4s infinite` at `:375`/`:357` — the audit's "2.4-second repeating animation", exactly). **Acceptance:** under emulated `reduce`, `document.getAnimations().filter(a => a.playState === 'running')` is empty on both routes and every `<video>.paused === true`.

### Task 4.4 — Cut first-view media cost
P1.8 · `src/components/hero.tsx`, `src/lib/hero-src.ts`. **The rendition switch exists but runs too late:** `HERO_SRC_DEFAULT` (`/hero-1080.mp4`, **30,502,364 B** — an exact match to the audit's 30.5 MB) is baked into the statically-exported HTML, so the preload scanner sees the 1080p URL before the `useEffect` swap. Fix with `<source media>` so the correct rendition is chosen before JS, and add a poster (no `<video>` on the site has one — the single cheapest first-view win). **Acceptance:** at 390×844 first view, no `hero-1080.mp4` entry in `performance.getEntriesByType('resource')`, total ≤1.5 MB; at 1440×900 ≤2.5 MB.

### Task 4.5 — Delete unreachable assets
Not in the audit — discovered during review. ≈46 MB of `public/` is provably unreachable from `src/`: `logo.png` 13.8 MB, `ascii-magic-6.mp4` 12.9 MB, `brain-hero.mp4` 8.8 MB, `rro-cutout.webp` 5.6 MB (reachable only from the never-imported `gallery-frame.tsx`), `ro.mp4` 3.3 MB, `icon.webp` 1.1 MB, `media/headband-exploded-2s.mp4` 1.5 MB (declared at `brink-system-explorer.tsx:83` but no `<video>` renders it). Costs no bandwidth; cuts the deploy from 115 MB to ≈69 MB. **Requires explicit sign-off before deleting** — verify against git history that none is a staged future asset.

### Task 4.6 — `THREE.Clock` — accepted, not fixed
Documented per A7. Revisit when `@react-three/fiber` moves to `THREE.Timer`.

---

## Phase 5 — Visual polish and final rendered QA

**Status: not started.**

- **5.1** Full rendered matrix: 2 routes × {1440×900, 390×844, reduced-motion} — the audit's own six-cell matrix, re-run and each row moved to pass.
- **5.2** Decide `about.tsx`: delete it, or mount it and renumber `writing.tsx:17` from `SEC-02` to `SEC-01` (today the site ships a SCIENCE section numbered 02 with no visible 01).
- **5.3** Cheap relabels deferred from Phase 2: `Prediction error` → `Forecast error · decline onset`.
- **5.4** Typography and spacing pass over everything Phases 1-3 changed, against the identity constraints in the preamble.
- **5.5** Re-read the whole site as a cold investor and time how long it takes to state Brink's thesis aloud. Target: under 60 seconds.

---

## Verification protocol (applies to every phase)

```bash
# gates — there is no test suite (A9)
bun run lint      # bunx tsc --noEmit && next lint
bun run build     # next build → out/

# demo regeneration, only when scripts/build-demo.mjs changed
node scripts/build-demo.mjs && bun run build
shasum out/demo/index.html public/demo/index.html   # must match

# serve the export the way Vercel does (directory index, not index.html)
bunx serve out -p 3000
```

Browser, per route, at 1440×900 and 390×844:

```js
// zero console errors — read the DevTools error badge directly;
// SVG attribute errors come from the parser and do NOT hit console.error
document.documentElement.scrollWidth <= document.documentElement.clientWidth   // true
[...document.querySelectorAll('button,a,input,select')].filter(el => {
  const r = el.getBoundingClientRect();
  return r.width && (r.right > innerWidth || r.left < 0);
})                                                                            // []
// reduced motion (DevTools → Rendering → Emulate prefers-reduced-motion: reduce)
[...document.querySelectorAll('video')].map(v => [v.currentSrc.split('/').pop(), v.paused])
document.getAnimations().filter(a => a.playState === 'running')               // []
// first-view bytes (Network: disable cache, Fast 4G, no scroll)
performance.getEntriesByType('resource').reduce((s,r) => s + r.transferSize, 0)
```

---

## Completion record

### Phase 1 — completed 2026-08-04

| Task | Status | Files changed |
|---|---|---|
| 1.1 Hero rehierarchy | ✅ | `src/components/hero.tsx` |
| 1.2 fNIRS + SCIENCE opener | ✅ | `src/components/writing.tsx` |
| 1.3 Science cards + DOIs | ✅ | `src/lib/data.ts` |
| 1.4 Signal-quality copy | ✅ | `src/components/brink-system-explorer.tsx` |
| 1.5 Dead THESIS copy | ✅ | `src/components/about.tsx` |
| 1.6 OG/Twitter metadata | ✅ | `src/app/layout.tsx`, `public/og.jpg` (new, 1200×630, 104 KB) |

#### Gates

`bun run lint` (`bunx tsc --noEmit && next lint`) — **pass**, no warnings or errors.
`bun run build` — **pass**, static export generated, homepage 83.2 kB / 187 kB First Load JS.
There is no test suite (A9); no test claim is made.

#### Decisions taken during implementation

1. **The hero `TypingAnimation` was removed entirely, not merely stopped from looping.** The plan first proposed keeping it with `loop={false}` so it would settle. A 1440×900 capture showed it mid-type as a meaningless amber smudge — the same class of failure the audit flagged. The amber bar is the memorable identity element; the typing was the liability. The bar is preserved as static text carrying the full strategic frame, verbatim. `src/components/ui/typing-animation.tsx` still exists and is now unimported.
2. **CTA labels deviate from the audit,** as planned in Task 1.1. `SEE THE CLOSED LOOP` → `#app`; `INSIDE THE HEADBAND` → `#how-brink-works`.
3. **A width bug was found and fixed during verification.** `max-w-[56ch]` on a monospace subhead resolves to 436.8px — wider than a 390px viewport. Under `align-items: center` these blocks are shrink-to-fit, so a bare `max-w` in `ch` units widened the whole column. Fixed with `w-full max-w-[…]` on both the headline and subhead.

#### Measured verification (390 × 844, fonts loaded)

| Check | Result |
|---|---|
| `documentElement.scrollWidth` vs `clientWidth` | 390 / 390 — no horizontal overflow |
| Elements in `#home` past either edge | **0** |
| Subhead computed width | 366 px (cap working; `max-width` 436.8 px) |
| Text overflowing its own box (`scrollWidth` vs `clientWidth`) | eyebrow 366/366, h1 262/262, subhead 366/366 — none |
| CTA hit targets | both 217 × 44 px — meets the ≥44 px criterion |
| `<h1>` count in the export | **1** (was 2 — pre-existing bug, fixed) |
| `grep -ri fnirs src/ public/demo/` | 0 hits |
| `og:*` / `twitter:*` in `out/index.html` | present; `og:image` absolute at `https://www.neurabrink.bio/og.jpg` |
| Hero `currentSrc` at 390 px | `hero-720.mp4` — the mobile rendition swap works |

#### Revision — 2026-08-05, hero copy rolled back by the author

Task 1.1's **copy** was reverted at the author's request. The hero is back to the
pre-Phase-1 composition: `BRINK` wordmark as the sole `<h1>`, with the looping
two-phrase typed tagline beneath it. The static eyebrow, the serif headline
("Know when your capacity is about to drop…") and the mono subhead were removed.

What Task 1.1 **kept**:
- the two calls to action — `SEE THE CLOSED LOOP` → `#app` and `INSIDE THE HEADBAND` → `#how-brink-works`, 44px targets, replacing the 10px `Open` anchor;
- the gradient scrim, re-weighted to the bottom edge so it seats the CTAs and carries the hero into the ink the ASCII brain section opens on;
- exactly one `<h1>` (the typed tagline renders as a `<p>`, so the two-`<h1>` bug stays fixed).

**Audit consequence, recorded honestly:** P0.1's core finding is no longer fully
addressed. The positioning statement is again carried only by the typed
animation, so it is legible for part of its cycle rather than on first paint,
and the word "headband" is no longer in the hero. Tasks 1.2–1.6 (fNIRS, science
cards, DOIs, signal-quality copy, metadata) are untouched and still in force.

#### Known limitations of this verification

- **Headless screenshots of this site are not trustworthy.** The preloader's completion loop is driven by `requestAnimationFrame`, which does not advance under Chrome's `--virtual-time-budget`, so headless captures paint a pre-settled page and show phantom clipping. Layout was therefore verified by measuring `getBoundingClientRect()` in a real 390 px layout instead, which is the stronger evidence. **This is a headless artifact only** — the preloader has a `MAX_MS` fallback (`t >= MAX_MS || (heroReady && t >= MIN_MS)`, `preloader.tsx:139`) so real users always exit it.
- **The reduced-motion check was inconclusive**, not passed. Under `--force-prefers-reduced-motion` every video reads `paused=true`, but so does every video *without* the flag, because nothing autoplays in headless — the test cannot distinguish the two. What is established instead: `git diff` confirms Phase 1 changed **no** video, `playbackRate`, IntersectionObserver or `matchMedia` line, and the only motion change is a removal. Genuine reduced-motion work, including the CSS backstop and the `footer-brain-video.tsx` gap, is Task 4.3.
- Acceptance criterion 1.1(1) ("readable with JS disabled") is satisfied by construction — all four blocks are static markup in the static export — but was not separately exercised with JS off.

Phases 3-5 not started.

---

### Phase 2 — completed 2026-08-05

| Task | Status | Where |
|---|---|---|
| 2.1 Live State opens on NOW/FORECAST/ACTION/LEARNING; Goals demoted | ✅ | `scripts/build-demo.mjs` §6a, §6c, §6e |
| 2.2 Scenario-correct chart labels and axes | ✅ | §6a `pred.*`, §6b axis, §6f legends |
| 2.3 Evidence grades replace causal language | ✅ | §6h |
| 2.4 Define every prediction | ✅ | §6a `pred.event/horizon/uncertainty/precedent`, §6c |
| 2.5 Product maturity legend | ✅ | §6g, `src/components/app-demo.tsx` |
| 2.6 Decisive visual hierarchy and single-meaning red | ⚠️ **Partial** | hierarchy done; red semantics deferred — see below |
| 2.7 Fate of the dead Session Timeline | ✅ Decided: leave inert | nothing deleted; see below |

**Files changed:** `scripts/build-demo.mjs`, `scripts/demo-tour.js`, `public/demo/index.html` (regenerated), `src/components/app-demo.tsx`.

#### Dashboard hierarchy, before and after

| | Before | After |
|---|---|---|
| Band 1 | Goals: heading, input, three goal rows, `min-height:460px` — **half the opening screen** | One-line goal strip (title · caption · status · "plans live in Capacity Profile") |
| Band 2 | narrative + `metaRows` k/v strip + recommendation, in a 380px right rail | **The loop**: four columns, `01 NOW · 02 FORECAST · 03 ACTION · 04 LEARNING`, each with a provenance grade, a title, a statement, tabular facts and a full-width note |
| Band 3 | 7-column `dims` sparkline strip | unchanged |
| Band 4 | "What Brink sees" │ "Approaching your brink" | unchanged structurally; legends, axis and counterfactual labelling corrected |

The live beat carries a gold top rule and gold numeral, so which stage of the loop the scenario is *in* is visible without reading: NOW for deep work, meditation and running; ACTION for strength; LEARNING for post-reset.

#### Features retained, moved, renamed, redesigned

- **Moved, intact:** the goal planner (input, "Plan it", all three goal rows with cell strips and captions) → Capacity Profile, retitled "Goals and plans". Its `data-tour` anchors travelled with the markup, so the walkthrough still rings it.
- **Redistributed, not deleted:** `narrative` → NOW body; `metaRows` facts → NOW/FORECAST rows; `recommendation` → ACTION title. `metaRows` itself is no longer rendered; every fact it carried appears in the loop band.
- **Renamed:** `Model confidence` → `Forecast confidence` (4 scenario tables); `Neural drive proxy` → `Effort-related neural feature` (2 sites, plus an "experimental, not a direct measure of motor-unit drive" caveat); device heading `Brink Prototype 04` → `Brink Headband` (the sidebar already said Headband, so the two surfaces had disagreed).
- **Added:** per-section role line and maturity chip in the header; global "every value on this screen is simulated" in the sidebar; safety-boundary field in ACTION; personal-precedent field in FORECAST; "Dashed and shaded series are model-estimated, never observed" under the forecast chart.
- **Untouched:** Signal Studio, Interventions, Device panels; the `dims` strip; the factors panel and its Simple/Technical toggle.

#### Provenance and evidence grades

Every loop module states where its numbers come from, in the existing 9px mono metadata register: `MEASURED SIGNALS · INFERRED STATE`, `PREDICTED · MODEL-ESTIMATED`, `SELECTED FROM MEASURED RESPONSES`, `MEASURED · N PRIOR DELIVERIES`. Where a claim cannot be supported the grade says so: `GUIDANCE · NOT A TESTED INTERVENTION`, `NO TESTED INTERVENTION`, `NO UPDATE THIS SESSION`, `MEASURED RESPONSE · NOT RANDOMISED`. Nothing anywhere displays the top two rungs of the evidence ladder, because nothing in `ivLib` is randomised.

Causal language removed: `Brink has high confidence this is causal for you` → `association, not established causation`; `not just correlation… controlled for sleep and workload` → `observational; sleep and workload were adjusted for, not controlled`; `Yes, with high confidence` → `Yes, on the measured response`; `separated from it decisively` → `separated from it within two minutes`; the counterfactual caption now ends `The dashed line was never observed.`

#### Scenario-specific changes

The x-axis was hardcoded to 40 minutes for all five scenarios, so *strength* plotted "wait 40 seconds" advice on a 40-minute axis and *meditation*'s "~4 min" marker sat at +11 to +20 min. Verified in the rendered DOM after the fix:

| Scenario | Forecast event | Axis ticks | Window | Legend |
|---|---|---|---|---|
| Deep work | Meaningful decline in sustained attention | +10/+20/+30/+40 min | 3:48–3:57 PM | Estimated decline likelihood |
| Meditation | Reaching your settled meditation pattern | +2/+4/+6/+8 min | ~4 min | Likelihood of reaching your settled pattern |
| Running | Running-form breakdown | Rep 6/7/8/8 end | Rep 7–8 | Estimated likelihood of form breakdown |
| Strength | A set at full set-one quality | 0:45/1:30/2:15/3:00 | Optimal window | Estimated set-quality likelihood |
| Post-reset | Decline onset, re-forecast after the reset | 3:49/4:00/4:12/4:23 PM | ~4:19 PM | Updated decline likelihood, after the reset |

Strength's curve was also moved (`onset` .35 → .72, `window` [.4,.62] → [.93,1]) because its optimal window sat at +16→+25 min on a rest-duration scenario; running's window moved to [.5,.75] so the dashed markers land on the reps its label names. These are the only two curve-shape changes.

**There is no cycling scenario.** The brief lists "running, meditation, cycling, strength, and work"; the demo ships deep work, meditation, running, strength and post-reset. No cycling scenario was invented — that would be adding product surface that does not exist.

#### Honest-abstain states (P1.1)

Where a scenario has no supporting evidence the dashboard says so rather than borrowing another scenario's numbers:
- **Strength** — `NO TESTED INTERVENTION` · "No between-set intervention has ever been tested on you… Brink offers it as guidance rather than something it has measured working." Tested: 0 deliveries. Model change: None.
- **Meditation** — `NO UPDATE THIS SESSION` · "A session that needs no help teaches it very little." No delivery, no model change.
- **Running** — signal quality and forecast confidence both carry `motion-limited`, and NOW's signal figure renders in accent to mark degraded input.

#### Task 2.6 — why it is partial

The hierarchy half is done: one dominant state, one forecast, one action, with supporting signals, factors, chart and history below. The **red-semantics half is not**. Accent still means five things — elevated risk, the live loop beat, safety boundaries, active navigation and selected scenario. Moving navigation and selection to a neutral treatment touches the JS style builders for `navItems` and `scenarios` and changes the authored look of the sidebar, which is a visual-identity decision rather than a correctness one. **Deferred to Phase 5** (visual polish), where it belongs next to the rest of the identity pass.

#### Task 2.7 — Session Timeline decision

Left **inert and intact**. Restoring it would add a seventh nav item that the brief's own six-area list does not ask for, and would cascade into `names`, the `showScenarios` gate and the walkthrough. Deleting it would remove ~95 lines of working product depth. The one thing it held that the audit wanted — explicit abstain language — is now delivered better, per scenario, in the LEARNING module.

#### Build, lint and verification

- `bun run lint` (`bunx tsc --noEmit && next lint`) — **pass**, no warnings or errors.
- `bun run build` — **pass**, static export generated.
- `node scripts/build-demo.mjs` — **pass**; all 22 pre-existing `patch()` anchors plus 24 new ones asserted and matched. Before any edits, the generator was confirmed to reproduce the committed `public/demo/index.html` byte-for-byte (SHA-256 match), so the pipeline was known-good first.
- No test suite exists (A9); no test claim is made.

Browser verification, Chrome headless against the served static export:

| Check | Result |
|---|---|
| All 5 scenarios rendered and inspected | pass — driven through `window.__dash.scenarios[i].go()` |
| All 6 sections reachable and rendered | pass |
| Axis ticks + legends per scenario | pass — read from the rendered DOM, table above |
| Demo console errors | **65 before, 65 after** — byte-identical class; every one is the pre-existing `{{ }}` SVG placeholder (Task 3.1) |
| Any non-placeholder console error | **none** |
| SVG placeholder occurrences | 42 before, 42 after — unchanged |
| Demo at 390×844 | `docEl.scrollWidth` 390 both before and after; furthest-right element 1045px **both** — no new mobile regression |
| Homepage at 390×844 | `docEl.scrollWidth` 390, `#app` overflow none, frame chrome 354/354 |
| Phase 1 intact | pass — hero headline, both CTAs, science cards, DOIs, OG image, single `<h1>`, zero fNIRS |

#### Responsive readiness for Phase 3

The loop band is `grid-template-columns:repeat(4,minmax(0,1fr))`. `minmax(0,1fr)` prevents content-driven blowout, so a single Phase 3 media query flips it to `repeat(2,1fr)` and then `1fr` with no markup change. The goal strip already uses `flex-wrap`. The demo remains unusable on a phone for the reasons P0.5 documents — 216px fixed sidebar, `overflow:hidden`, zero `@media` rules — and that is unchanged, not worsened.

#### Assumptions and deferred items

- **Maturity chips are conservative.** Every value in the demo comes from a lookup table and a deterministic PRNG, so no surface claims `LIVE PROTOTYPE`. Device and Live State read `Simulated output`. If the headband, firmware and serial shown on Device refer to real hardware, Device should be promoted — that is a founder sign-off, not an engineering call.
- **Delivery channels** use the one real string in the product (`Haptic-guided · 4.5 breaths/min · delivered on-device`, plus the haptic actuator's own description) adapted per scenario. No new hardware capability is implied.
- **Safety boundaries are new text.** They are not measurements and make no scientific claim; the running and strength lines state plainly that Brink cannot detect pain, dizziness or chest symptoms.
- `metaRows` is computed but no longer rendered. Left in place rather than deleted so Phase 3/5 can re-home it if wanted.
- P1.4 longitudinal moat charts remain deferred, as planned.
