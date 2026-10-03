import { liteGraphics } from './graphics';

export interface WarmupTask { id: string; load: () => Promise<unknown> }
export interface WarmupHost {
  allowed: () => boolean;
  busy: () => boolean;
  schedule: (run: () => void) => () => void;
}
// One request at a time, including on fast devices. Opening a page uses the same cached loader.
export function warmPages(tasks: WarmupTask[], host: WarmupHost) {
  let stopped = false;
  let cancel: (() => void) | undefined;
  const pending = [...tasks];
  function next() {
    if (stopped || !pending.length || !host.allowed()) return;
    cancel = host.schedule(() => {
      if (stopped || !host.allowed()) return;
      if (host.busy()) { next(); return; }
      const task = pending.shift()!;
      // Speculative failures are silent. A foreground open can retry the failed loader.
      void task.load().catch(() => undefined).finally(next);
    });
  }
  next();
  return () => { stopped = true; cancel?.(); };
}

export function startPageWarmup(tasks: WarmupTask[], isBusy: () => boolean) {
  if (typeof window === 'undefined') return () => {};
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  let lastInput = Date.now();
  const input = () => { lastInput = Date.now(); };
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.addEventListener(event, input, { passive: true });
  const stop = warmPages(tasks, {
    allowed: () => !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType ?? ''),
    busy: () => document.hidden || Date.now() - lastInput < (liteGraphics.value ? 3000 : 1500) || isBusy()
      || !!document.activeElement?.matches('input, textarea, [contenteditable="true"]'),
    schedule: run => {
      let idle: number | undefined;
      const timer = window.setTimeout(() => {
        // No timeout: user interaction takes priority over speculative work.
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(run);
        else run();
      }, liteGraphics.value ? 1500 : 750);
      return () => { window.clearTimeout(timer); if (idle !== undefined) window.cancelIdleCallback(idle); };
    }
  });
  return () => { stop(); for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) window.removeEventListener(event, input); };
}
