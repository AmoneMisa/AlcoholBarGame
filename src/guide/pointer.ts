import { shallowReactive } from 'vue';

// The pointer that shows EXACTLY what to do: a circle on the real button or bottle and a moving hand that shows the
// gesture (tap, drag, swipe or type). The tour and the practice both put pointers here; one overlay draws them.
//
// A pointer is a list of candidates in order of importance. The first candidate whose element is on the screen
// (and whose `when` is true) is drawn, so a lesson can say "press Make the offer, otherwise choose something,
// otherwise press Offer" and the pointer follows what the screen shows right now.

export type Gesture = 'tap' | 'drag' | 'swipe' | 'type';

export interface PointerSpec {
  /** A CSS selector of the element to point at. Use the data-guide attributes (see GUIDE_ATTRIBUTES). */
  target: string;
  /** For a drag: the element to drag to. */
  to?: string;
  gesture: Gesture;
  /** Said next to the circle. {Tap} becomes "Tap" on a touch screen and "Click" with a mouse. */
  label: string;
  /** Only elements whose text contains this are matched (the word tiles, the drink names). */
  hasText?: string;
  /** A check that runs on every refresh, for what a selector cannot say. */
  when?: () => boolean;
}

export type PointerLayer = 'tour' | 'help' | 'practice';
export const guide = shallowReactive<{ tour?: PointerSpec[]; help?: PointerSpec[]; practice?: PointerSpec[] }>({});
export const setPointer = (layer: PointerLayer, candidates?: PointerSpec[]) => { guide[layer] = candidates?.length ? candidates : undefined; };

/** The data-guide names and attributes the lessons point at. Every one must exist in a component (see the tests). */
export const GUIDE_ATTRIBUTES = [
  'guest', 'give-water', 'give-ashtray', 'offer-open', 'offer-item', 'offer-ask', 'new-question', 'tile-bank', 'talk-send',
  'phrase-idea', 'talk-input', 'situation-choice', 'talk-close', 'glass', 'fresh-plus', 'rules-button', 'shake', 'serve', 'market-plus',
  'market-order', 'top-up', 'nav-service', 'nav-english', 'nav-manage', 'nav-market', 'nav-recipes', 'nav-inventory', 'clue-board', 'talk-actions', 'data-guide-ingredient', 'data-guide-fresh'
] as const;

export const selector = (name: (typeof GUIDE_ATTRIBUTES)[number]) => `[data-guide="${name}"]`;

export const isTouch = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
export const wording = (label: string) => label.replace(/\{Tap\}/g, isTouch() ? 'Tap' : 'Click').replace(/\{tap\}/g, isTouch() ? 'tap' : 'click');

const onScreen = (element: Element) => {
  const box = element.getBoundingClientRect();
  if (box.width <= 1 || box.height <= 1) return false;
  // A hidden browser pane reports a window of size 0: then only the size of the element tells if it is shown.
  const width = window.innerWidth || document.documentElement.clientWidth;
  const height = window.innerHeight || document.documentElement.clientHeight;
  if (width && height && !(box.bottom > 0 && box.right > 0 && box.top < height && box.left < width)) return false;
  return !coveredByDialog(element, box, width, height);
};

// A button hidden behind an open dialog (the navigation under the conversation) is not pointed at: the pointer would
// float over the dialog and tell the player to press something they cannot reach.
function coveredByDialog(element: Element, box: DOMRect, width: number, height: number) {
  if (!width || !height || typeof document.elementFromPoint !== 'function') return false;
  const x = Math.min(width - 1, Math.max(0, box.left + box.width / 2));
  const y = Math.min(height - 1, Math.max(0, box.top + box.height / 2));
  const top = document.elementFromPoint(x, y);
  if (!top || element.contains(top) || top.contains(element)) return false;
  return !!top.closest('.talk-popup, .modal-sheet, .modal-backdrop, [aria-modal="true"]:not(.tour)');
}

export function findTarget(spec: PointerSpec, root: ParentNode = document): Element | undefined {
  const all = [...root.querySelectorAll(spec.target)];
  return all.find((element) => onScreen(element) && (!spec.hasText || (element.textContent ?? '').toLowerCase().includes(spec.hasText.toLowerCase())));
}

export function pickPointer(candidates: PointerSpec[] | undefined) {
  for (const spec of candidates ?? []) {
    if (spec.when && !spec.when()) continue;
    const element = findTarget(spec);
    if (element) return { spec, element };
  }
  return undefined;
}
