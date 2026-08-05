# Brink Website and Interactive Demo Audit

**Date:** 5 August 2026  
**Routes tested:** `https://www.neurabrink.bio/` and `https://www.neurabrink.bio/demo/`  
**Primary lens:** skeptical pre-seed or seed investor preparing for a first conversation  
**Authoritative positioning:** Brink is building the operating system for human capacity. It continuously understands cognitive and physical state, predicts when performance is beginning to decline, and delivers personalized interventions in real time. The first product is a neuroperformance headband combining brain, physiological, movement, and contextual signals.

---

## Executive verdict

Brink already has two unusually strong assets:

1. A distinctive, authored visual identity that does not resemble a generic wearable or SaaS landing page.
2. A surprisingly complete product concept spanning sensing, current-state inference, prediction, intervention, response measurement, and longitudinal learning.

The problem is not lack of product ambition. The problem is that the strongest idea is not the first or clearest thing the experience communicates.

A skeptical investor's likely first impression is currently:

> "This looks original and technically ambitious, but I am not yet sure what is real, what is simulated, what the scientific boundary is, or why the interface starts with a habit tracker."

The site becomes compelling only after sustained exploration. VC interviews require the opposite: the operating loop, first product, evidence boundary, and compounding data advantage should be obvious within the first 30 to 60 seconds.

### Overall assessment

| Dimension | Current assessment | Why |
|---|---:|---|
| Visual distinctiveness | **Strong** | Authored editorial language, disciplined palette, memorable imagery |
| Product breadth | **Strong** | Six coherent surfaces cover sensing through learning |
| Immediate company clarity | **Weak** | The hero prioritizes mood and brand over product, outcome, and first interface |
| Closed-loop narrative | **Promising but buried** | The loop exists across pages, but not as one legible story |
| Scientific credibility | **At risk** | Several claims are broader or more causal than the cited evidence supports |
| Investor trust | **At risk** | Hardware and modality contradiction, undefined confidence, simulated certainty, runtime errors |
| Mobile demo | **Blocking failure** | Fixed sidebar consumes most of the viewport and primary controls are clipped |
| Runtime polish | **Needs repair** | Demo emits 65 console errors from unresolved SVG template placeholders |
| Accessibility | **Needs repair** | Demo has no document title or language; homepage lacks general keyboard focus styling |
| Performance and motion | **Needs repair** | Heavy media, one audit crash under full traversal, and motion continues with reduced-motion preference |

---

## What should be preserved

### 1. The visual identity

Keep the monochrome, grain, industrial typography, and restrained red accent. It feels authored and culturally specific. Do not replace it with a conventional white-background wearable website, floating cards, gradient glass, or a generic dashboard hero.

### 2. The phrase "operating system for human capacity"

This is the correct strategic frame. It separates Brink from an EEG gadget, readiness tracker, or meditation wearable.

### 3. The six-surface product model

The current demo contains a credible product architecture:

- Live State
- Ask Brink
- Interventions
- Signal Studio
- Capacity Profile
- Device

These surfaces collectively show sensing, inference, explanation, action, and learning. The issue is sequencing, not breadth.

### 4. Scenario breadth

Deep work, meditation, running, strength, and post-reset demonstrate that the platform is not confined to one activity. Keep this breadth, but label scenario maturity so a prototype does not appear to claim validated performance in every context.

### 5. Artifact handling and data quality

Signal Studio's raw-versus-cleaned EEG, motion-artifact exclusion, channel quality, and confidence concepts are among the most credibility-building parts of the product. Elevate them when explaining why the model can be trusted.

### 6. The intervention learning loop

The strongest screen-level concept is not a score. It is the sequence:

> detect a precursor → forecast risk → select an intervention → measure the response → update the personal model

This should become the primary demonstration.

---

# Priority plan

## P0: Fix before VC interviews

### P0.1 Make the company legible in the first screen

The current hero is visually memorable but semantically incomplete. In actual desktop and mobile captures, the dominant information is the Brink wordmark, abstract eye imagery, and a moving red label that can be clipped mid-phrase. The headband, operating loop, user outcome, and meaningful call to action are not immediately visible. The mobile CTA reads only `OPEN` and is visually tiny.

#### Replace the opening hierarchy with

**Eyebrow**  
`BRINK · HUMAN CAPACITY OS`

**Headline**  
`Know when performance is about to decline. Intervene before it does.`

**Subhead**  
`Brink combines brain, physiological, movement, and contextual signals to learn your baseline, forecast decline, and deliver personalized interventions. The first interface is a neuroperformance headband.`

**Primary CTA**  
`WATCH THE CLOSED LOOP`

**Secondary CTA**  
`EXPLORE THE PROTOTYPE`

The visual treatment can remain cinematic. The text needs to be stable, complete, and readable without waiting for an animation cycle.

### P0.2 Start the demo with the closed loop, not Goals

The current first demo viewport is dominated by three goal trackers. This makes Brink resemble a habit or productivity app before the neuroperformance intelligence becomes visible.

Move Goals to Capacity Profile, or collapse them into a small context strip.

The default Live State view should open with four linked modules:

| Module | Required content |
|---|---|
| **NOW** | Current state, activity, signal quality, and concise interpretation |
| **FORECAST** | What is likely to decline, estimated window, and uncertainty |
| **ACTION** | Recommended intervention, delivery channel, and rationale |
| **LEARNING** | What happened after the previous intervention and how the model changed |

A single glance should complete the sentence:

> "Brink sees this, predicts this, will do this, and learns this."

### P0.3 Repair the scientific claim boundary

Several statements currently convert suggestive research into universal or mechanistic certainty.

#### Current risk

- `The tank is never empty.`
- `The limit was set by the brain, not the muscle.`
- `Exhaustion isn't your muscles failing. It's your prefrontal cortex deciding the effort isn't worth it.`
- `Brink reads that decision and hands the reserve back.`
- Demo answer: `High confidence, causal.`
- Strength scenario: `Neural drive proxy: 96%` from a frontal headband.
- Running scenario: `Your limitation appears perceptual rather than mechanical.`

#### Why this is a problem

Marcora and Staiano's 2010 study involved ten fit male participants. Immediately after exhaustive cycling at a mean 242 W, participants could briefly produce a mean 731 W, approximately 3.02 times the task power. The abstract says this challenges complete muscle-fatigue explanations and suggests a role for perception of effort. It does not establish that every limit is set by the brain, that the prefrontal cortex makes a singular stop decision, or that a forehead wearable can safely reveal capacity that should be overridden.

The local Brink neurotechnology evidence base reaches the same responsible boundary: EEG, PPG, HRV, EDA, IMU, temperature, respiration, and context can support personalized estimates of state and risk. They do not directly measure a hidden biological reserve or prove a single neural mechanism.

#### Replacement science language

**Science section opener**

> `Signals associated with workload, arousal, and fatigue can change before a visible performance drop. Brink is testing whether a multimodal, person-specific model can turn those changes into useful early warnings.`

**Marcora card**

> `Perceived effort helps shape endurance limits. In a small study of ten fit men, participants could briefly produce about three times the task power immediately after exhaustion. The result suggests that task failure is not explained by complete loss of muscle power alone.`

Citation: Marcora and Staiano, 2010, DOI `10.1007/s00421-010-1418-6`.

**Mechanism card**

> `Effort is not one signal or one brain region. It emerges from perceived effort, motivation, physiology, task demands, and context. Brink combines these inputs rather than treating any single metric as truth.`

For the psychobiological model, use a complete, traceable reference rather than `Marcora, psychobiological model (2009)`. A relevant review is Pageaux, 2014, DOI `10.1007/s40279-014-0198-2`.

### P0.4 Resolve the fNIRS contradiction

The homepage says Brink identifies precursor states through `EEG, fNIRS, HRV, and physiological signals`. The Device screen lists frontal EEG, contact-quality array, skin temperature, haptic actuator, optical PPG, and IMU. It does not list fNIRS.

This is a major diligence trigger. An investor will ask whether fNIRS is in the product, in a lab reference rig, or only in supporting literature.

Choose one truthful version:

1. If the first headband includes fNIRS, show the emitters, detectors, wavelengths, channels, optical geometry, and signal-quality controls in Device.
2. If fNIRS is only used in research, write: `Research models may be benchmarked against laboratory modalities including fNIRS; the first product uses EEG, optical pulse sensing, movement, temperature, and context.`
3. If it is not part of the current system, remove it from product copy.

### P0.5 Fix the mobile demo

At 390 × 844:

- The sidebar remains approximately 215 pixels wide.
- Only about 175 pixels remain for the main product surface.
- Nine primary controls are clipped, including all five scenario buttons.
- The main content is clipped rather than horizontally scrollable.
- Goal text, charts, and status modules are cut off.

This is not a minor responsive issue. The product demo is unusable on a phone.

#### Required mobile structure

- Replace the permanent sidebar with a compact top bar and sheet or drawer.
- Put scenario selection in a horizontally scrollable but fully discoverable row, or a native select menu.
- Stack NOW, FORECAST, ACTION, and LEARNING vertically.
- Keep values at readable sizes and remove dense microcopy from the first mobile screen.
- Preserve charts only when their axes and annotations remain readable.

### P0.6 Eliminate the SVG runtime errors

The demo generated **65 console errors**, with **63 unique messages**, on every desktop, mobile, and reduced-motion load. Examples include:

- `<path> attribute d: Expected moveto path command, "{{ d.spark }}"`
- `<line> attribute x1: Expected length, "{{ g.x }}"`
- `<path> attribute d: Expected moveto path command, "{{ predLine }}"`
- `<rect> attribute x: Expected length, "{{ mk.bx }}"`

The interface eventually renders, but the browser is parsing unresolved mustache-style placeholders before the framework replaces them. This creates noisy telemetry and can produce unstable first frames or broken charts.

Use framework-safe SVG bindings such as `:d`, `:x`, `:y`, `:x1`, and `:x2`, or generate the SVG after data is ready. The clean acceptance criterion is zero console errors on load and after every scenario and tab change.

### P0.7 Correct chart semantics across scenarios

The scenario system reuses labels that no longer match the prediction:

- Meditation describes the probability of reaching a settled state while the chart legend still says `Estimated decline likelihood`.
- Strength uses `Estimated set-quality likelihood` while the legend again says `Estimated decline likelihood`.
- Recovery improvements are presented under `Expected form of decline`.

This reads as a template reuse bug and weakens confidence in the model.

Use scenario-specific outcome labels and units, or define one consistent latent target such as `risk of meaningful capacity loss` and make every scenario genuinely map to it.

---

## P1: Improve immediately after blockers

### P1.1 Define every prediction

`Model confidence 87%` currently has no interpretable meaning. It might mean classifier probability, signal quality, calibration, model agreement, or historical precision.

Every prediction should expose:

- Target event definition
- Time horizon
- Signal coverage and artifact burden
- Personal data used
- Calibration status
- Historical false-positive and false-negative behavior
- An abstain or insufficient-signal state

Example:

> `Risk of meaningful attention decline in the next 40 minutes: 68%. Signal coverage 96%. Personalized on 38 days. Similar precursor pattern observed in 6 prior sessions.`

Do not report exact percentages unless the underlying model can support that precision.

### P1.2 Replace causal language with evidence grades

The current Ask Brink response says HRV decline was causal with high confidence. Six supporting sessions and correlated precursor windows do not establish causality.

Use a visible evidence ladder:

- **Observed association**
- **Repeated personal pattern**
- **Prospective prediction**
- **Randomized personal evidence**
- **Externally validated effect**

Only use `causal` when supported by randomized or otherwise defensible intervention evidence. Counterfactual curves should be labeled `model-estimated, not observed`.

### P1.3 Make the visual hierarchy more decisive

The demo is clean, but the first desktop screen distributes attention across Goals, narrative text, status values, seven metric strips, explanation, and forecast. The core state competes with secondary information.

Recommended hierarchy:

1. One dominant current-state statement.
2. One forecast with a human-readable consequence.
3. One actionable intervention.
4. Supporting signals and uncertainty.
5. Historical context and goals.

Red should have one semantic meaning. Prefer red for elevated risk or urgent intervention, not also active navigation, selection, decoration, and general emphasis.

### P1.4 Show the data moat, not just the accumulated profile

Capacity Profile currently shows calibration days, sessions, hours, interventions tested, and learned patterns. These are useful, but they do not prove that the model improves.

Add longitudinal evidence:

- Forecast lead time over time
- Calibration error over time
- Intervention success by context
- Percentage of sessions where the model abstained
- How quickly a new user moves from population prior to personal model
- Cross-context transfer, if supported
- Sensor contribution and graceful degradation

The investor question is not only `How much data exists?` It is `What gets better because this data exists, and why is that hard to copy?`

### P1.5 Clearly label product maturity

`ILLUSTRATIVE DEMO DATA` is present but visually quiet. The breadth and precision of the scenarios can imply that all capabilities are implemented and validated.

Add a persistent but elegant product-status legend:

- `LIVE PROTOTYPE`
- `SIMULATED OUTPUT`
- `RESEARCH MODEL`
- `PLANNED CAPABILITY`

This increases trust rather than weakening the pitch.

### P1.6 Fix metadata and accessibility basics

Homepage:

- Has title `Brink`, language `en`, and a useful meta description.
- Has no Open Graph or Twitter title, description, or image metadata.
- Has no general `:focus-visible` styling beyond the email input.
- Uses unlabeled looping videos.

Demo:

- Has no document title.
- Has no HTML language.
- Has no meta description or social metadata.
- Has an unnamed navigation landmark.
- Does not expose the active navigation item or scenario through `aria-current` or `aria-pressed`.
- The Device product video has no accessible name.

Add semantic landmarks, descriptive titles, visible keyboard focus, active-state semantics, meaningful video labels or `aria-hidden` for decorative media, and accessible chart summaries.

### P1.7 Add a real reduced-motion mode

Neither route contains a `prefers-reduced-motion` media query.

In the automated reduced-motion profile:

- The demo's 2.4-second repeating animation continued to run.
- One homepage looping video continued playing.

Reduced motion should:

- Pause nonessential looping videos.
- Replace scroll-scrubbed transformations with stable compositions.
- Remove repeating pulses and animated graph traces.
- Preserve all content and state changes without requiring motion.

### P1.8 Reduce initial media cost

An isolated first-view run loaded approximately **5.5 MB** on the homepage. After the page was fully exercised, the long-lived browser had accumulated approximately **43 MB**, including a hero media response of roughly **30.5 MB**. A full-page automated traversal crashed its target browser before completion.

This does not prove ordinary devices will crash, but it is a strong stress signal.

Priorities:

- Serve a much smaller mobile hero asset.
- Use responsive media sources.
- Lazy-load below-fold videos, images, and 3D assets.
- Provide poster frames before downloading full loops.
- Do not preload every narrative asset.
- Pause media when off screen.
- Remove the deprecated `THREE.Clock` usage and use `THREE.Timer`.

---

## P2: Redesign once the pitch is stable

### P2.1 Turn Ask Brink into an evidence interface

Ask Brink is currently a list of useful preset questions. Evolve it into a traceable explanation layer:

- Answer
- Evidence used
- Confidence and uncertainty
- Similar sessions
- Alternative explanations
- What would change the conclusion

This will feel more trustworthy than a conventional chatbot.

### P2.2 Separate current product from platform expansion

The site should explicitly render two layers:

**Today**

> A multimodal neuroperformance headband and companion system for understanding state, forecasting decline, and delivering personalized interventions.

**Platform**

> A human-capacity model that can learn across tasks, contexts, and future interfaces.

This makes the headband concrete without shrinking the company to hardware.

### P2.3 Add team and validation proof

The current page has no visible team section. For VC interviews, add concise proof rather than a long corporate biography:

- Founder and technical credibility
- Prototype status
- Study design or pilot stage
- Data collected, with clear definitions
- Research collaborators or advisors, only if confirmed
- Safety and regulatory boundary

### P2.4 Build a dedicated investor narrative route

Do not force an investor to reverse-engineer the consumer pre-order experience. A concise investor route can preserve the visual language while sequencing:

1. Problem
2. Product loop
3. First interface
4. Technical architecture
5. Validation status
6. Data moat
7. Expansion thesis
8. Team
9. Ask

---

# Recommended 90-second VC demo

## 0–10 seconds: State the thesis

> `Most wearables tell you what already happened. Brink learns your baseline, predicts when capacity is beginning to decline, and intervenes before the drop.`

Show the headband and the four-step loop.

## 10–25 seconds: Understand

Open a single session in Live State. Show:

- Current activity
- Concise state
- Signal quality
- The top three contributing factors

Do not begin with Goals.

## 25–40 seconds: Predict

Show:

- The defined target event
- Forecast window
- Uncertainty band
- Personal evidence from prior sessions

Say what the model knows and what it does not know.

## 40–55 seconds: Intervene

Trigger or replay a 90-second intervention. Explain why Brink selected it and how it is delivered through the headband or companion interface.

## 55–70 seconds: Measure the response

Switch to Post-reset. Show the observed changes in neural, autonomic, and behavioral signals. Clearly separate measured response from model-estimated counterfactual.

## 70–80 seconds: Learn

Show the intervention record and one concrete model update, for example:

> `This breathing pattern now ranks first for this user's high-strain focus sessions, based on five repeated responses.`

## 80–90 seconds: Zoom out to the platform

Open Capacity Profile and Signal Studio.

> `The first interface is a headband. The compounding asset is the person-specific model connecting state, context, intervention, and outcome.`

---

# Recommended dashboard information architecture

## Persistent top layer

- User and activity context
- Device and signal quality
- Scenario or session selector
- Demo or maturity label

## Primary loop

### NOW

- Human-readable state
- One primary capacity indicator
- Top evidence contributors
- Signal confidence

### FORECAST

- Defined event
- Time horizon
- Risk and uncertainty
- Personal precedent

### ACTION

- Intervention
- Rationale
- Delivery channel
- Safety boundary

### LEARNING

- Last observed response
- Model update
- Evidence grade

## Secondary workspace

- Signals
- Full explanation
- Intervention history
- Capacity profile
- Device diagnostics
- Goals and plans

---

# Exact demo language changes

| Current language | Recommended language |
|---|---|
| `Model confidence 87%` | `Forecast confidence: 87%. Personalized on 38 days; signal coverage 96%.` Use only if calibrated. |
| `High confidence, causal` | `Repeated personal association across six sessions. Causality not yet established.` |
| `Projected without intervention` | `Model-estimated counterfactual. Not directly observed.` |
| `Predicted focus preserved ~31m` | `Estimated delay to the risk threshold: about 31 minutes.` |
| `Your limitation appears perceptual rather than mechanical` | `Current pattern is more consistent with rising perceived effort than with the measured mechanical indicators. Stop for pain, dizziness, or abnormal symptoms.` |
| `Neural drive proxy 96%` | `Experimental effort-related neural feature. Not a direct measure of motor-unit drive.` |
| `Your brain has settled into a steady attention rhythm` | `Frontal EEG features are stable relative to your recent baseline.` |
| `What Brink sees` | Keep, but divide into `Measured`, `Derived`, and `Inferred`. |
| `Approaching your brink` | Keep as brand language, but define the predicted event directly beneath it. |

---

# Test evidence

## Rendered matrix

| Route | Profile | Result |
|---|---|---|
| Homepage | 1440 × 900 | Rendered; no horizontal overflow; hero remains product-light |
| Homepage | 390 × 844 | Rendered; second science card positioned completely off-canvas; hero message and CTA are clipped or underspecified |
| Homepage | Reduced motion | Preference detected by browser; no reduced-motion CSS; one looping video continued |
| Demo | 1440 × 900 | Rendered; first view dominated by Goals; 65 console errors |
| Demo | 390 × 844 | Fixed sidebar leaves about 175 pixels; nine controls clipped; primary task unusable |
| Demo | Reduced motion | Preference detected by browser; repeating 2.4-second animation continued; 65 console errors |

## Runtime

- No failed HTTP responses were recorded in the isolated six-profile matrix.
- Homepage emitted one deprecated Three.js warning.
- Demo emitted 65 SVG attribute errors on each load.
- The heavier full-page homepage recon target crashed during automated scrolling.

## Accessibility and metadata

- Homepage: title and `lang="en"` are present; meta description is present.
- Homepage: Open Graph and Twitter metadata are absent.
- Homepage: general keyboard focus styling is absent; only the email input has an explicit focus treatment.
- Demo: title, language, meta description, and social metadata are absent.
- Demo: active tab and scenario semantics are not exposed to assistive technology.
- Mobile demo: clipped content prevents access regardless of assistive technology.

## Scientific references checked

- Marcora SM, Staiano W. `The limit to exercise tolerance in humans: mind over muscle?` European Journal of Applied Physiology, 2010. DOI `10.1007/s00421-010-1418-6`. PubMed PMID `20221773`.
- Pageaux B. `The Psychobiological Model of Endurance Performance: An Effort-Based Decision-Making Theory to Explain Self-Paced Endurance Performance.` Sports Medicine, 2014. DOI `10.1007/s40279-014-0198-2`. PubMed PMID `24809249`.
- Brink's local neurotechnology evidence base: `/opt/data/brink-neurotech-research/BRINK-NEUROTECH-KNOWLEDGE-BASE.md` and `/opt/data/brink-neurotech-research/SOURCE-INVENTORY.md`.

## Audit artifacts

- Matrix JSON and screenshots: `/opt/data/visual-recon/output/BRINK-MATRIX-2026-08-05T02-31-37-594Z/`
- Matrix runner: `/opt/data/visual-recon/tmp-brink-matrix.mjs`

---

# Final recommendation

Do not replace the site’s identity. Replace its order of revelation.

The highest-leverage change is to make the operating loop the opening experience everywhere:

> **Understand the person now → predict the decline → intervene → learn from the response**

Then establish the scientific boundary with equal confidence. Brink will appear more credible, not less, when the interface distinguishes measured signals, derived features, inferred states, predictions, and counterfactuals.

If the hero, default demo state, scientific copy, modality contradiction, mobile layout, and SVG errors are corrected, the same underlying product can move from `beautiful speculative neurotech concept` to `coherent platform thesis with a believable first product` without losing its visual character.
