/**
 * Narrow handle on the running Lenis instance.
 *
 * Lenis owns the scroll position once it starts: it holds its own value and
 * reapplies it every frame, so a native scrollTo or scrollIntoView is undone on
 * the next tick. Anything that needs to move the page has to go through it.
 *
 * LenisProvider loads Lenis dynamically, so this is null until that resolves,
 * and stays null under prefers-reduced-motion where Lenis never starts. Callers
 * must handle both and fall back to native scrolling.
 */
export type LenisHandle = {
  raf: (time: number) => void;
  destroy: () => void;
  resize: () => void;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: { immediate?: boolean; force?: boolean; offset?: number },
  ) => void;
};

let instance: LenisHandle | null = null;

export function setLenis(next: LenisHandle | null) {
  instance = next;
}

export function getLenis() {
  return instance;
}
