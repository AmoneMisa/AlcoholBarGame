/** A bounded, deterministic idle cycle, independent of frame rate. */
export function avatarIdleAt(seconds: number, enabled = true) {
  if (!enabled) return { blink: 0, breath: 0, yaw: 0, nod: 0, sway: 0 };
  const t = Math.max(0, seconds);
  const pulse = (at: number, centre: number, width: number) => {
    const x = Math.abs(at - centre) / width;
    return x >= 1 ? 0 : .5 + .5 * Math.cos(Math.PI * x);
  };
  const cycle = t % 11.3;
  // Rapid closing and opening, with an occasional double blink.
  const blink = Math.max(pulse(cycle, 3.6, .12), pulse(cycle, 8.4, .12), pulse(cycle, 8.72, .10));
  return {
    blink,
    breath: Math.sin(t * 1.45) * .0022,
    yaw: Math.sin(t * .43) * .035 + Math.sin(t * .71) * .01,
    nod: Math.sin(t * .65) * .012,
    sway: Math.sin(t * .36) * .035,
  };
}
