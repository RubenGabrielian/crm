/**
 * Helpers for scripted demos: everything on screen is a pure function of one
 * clock `t` in milliseconds, so the parts of a demo can never drift apart.
 */

export type Window = readonly [number, number];

export const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** 0 before the window, 1 after it, linear in between. */
export const progress = (t: number, [from, to]: Window) =>
  clamp01((t - from) / (to - from));

export const within = (t: number, from: number, to: number) =>
  t >= from && t < to;

export const easeOut = (p: number) => 1 - (1 - p) ** 3;

export const lerp = (from: number, to: number, p: number) =>
  from + (to - from) * p;

/** The part of `text` typed so far, one character at a time across the window. */
export function typed(t: number, window: Window, text: string) {
  const chars = [...text];
  return chars
    .slice(0, Math.round(progress(t, window) * chars.length))
    .join("");
}
