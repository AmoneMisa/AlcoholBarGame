// Rows of tabs that are wider than the screen scroll sideways. Fingers do that by themselves; this lets a mouse (or a
// pen) drag them too, and a drag never counts as a click on the tab it started on.
const SCROLLERS = '.workshop-tabs, .learning-tabs, .category-tabs, .bar-switcher, .design-tabs, .job-switch, .market-modes, .bar-chips, .tabs-scroll';

export function installDragScroll() {
  let active: { el: HTMLElement; startX: number; startLeft: number; moved: boolean } | undefined;
  document.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const el = (event.target as HTMLElement | null)?.closest<HTMLElement>(SCROLLERS);
    if (!el || el.scrollWidth <= el.clientWidth + 2) return;
    active = { el, startX: event.clientX, startLeft: el.scrollLeft, moved: false };
  });
  document.addEventListener('pointermove', (event) => {
    if (!active) return;
    const delta = event.clientX - active.startX;
    if (Math.abs(delta) > 6) active.moved = true;
    if (active.moved) active.el.scrollLeft = active.startLeft - delta;
  });
  const end = () => { if (active?.moved) { const el = active.el; el.dataset.dragged = '1'; setTimeout(() => delete el.dataset.dragged, 0); } active = undefined; };
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  document.addEventListener('click', (event) => {
    const el = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-dragged]');
    if (el) { event.preventDefault(); event.stopPropagation(); }
  }, true);
}
