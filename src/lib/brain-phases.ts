/**
 * Scroll phase layout for the #brain section, shared by the ASCII engine that
 * defines the phases and the signal beats that ride on top of them.
 *
 * The section stacks three phases inside one pinned viewport:
 *
 *   assembly  100svh  the hero zoom-out shreds away, the ASCII brain assembles
 *   hold      HOLD    the brain sits assembled and idle-spinning, thesis up
 *   morph     MORPH   the brain drains into the nerve, scrubbed by scroll
 *
 * Anything that belongs to the NERVE must be authored in morph-local terms
 * (0..1 across the morph) and mapped through toSectionProgress. Anchoring it
 * to raw section progress instead couples it to the lengths of the two phases
 * in front of it, so lengthening the hold slides it back into the brain.
 */

export const ASSEMBLY_SCROLL_SVH = 100;
export const HOLD_SCROLL_SVH = 80;
export const MORPH_SCROLL_SVH = 360;

/** Section height, in svh: 100svh of hero overlap plus the three phases. */
export const SECTION_SCROLL_SVH =
  ASSEMBLY_SCROLL_SVH + ASSEMBLY_SCROLL_SVH + HOLD_SCROLL_SVH + MORPH_SCROLL_SVH;

/** Scrollable length of the section (its height minus the pinned viewport). */
const SPAN_SVH = SECTION_SCROLL_SVH - ASSEMBLY_SCROLL_SVH;

/** Section progress (0..1) at which the morph phase begins. */
export const MORPH_START = (ASSEMBLY_SCROLL_SVH + HOLD_SCROLL_SVH) / SPAN_SVH;

/** Map a morph-local position (0..1) onto section progress (0..1). */
export const toSectionProgress = (morphLocal: number) =>
  MORPH_START + morphLocal * (1 - MORPH_START);
