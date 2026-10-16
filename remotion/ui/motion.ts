import { interpolate, spring } from "remotion";
import { FPS } from "../timeline";

/** A snappy 0→1 spring starting at `delay` frames. */
export function pop(frame: number, delay = 0, damping = 14) {
  return spring({ frame: frame - delay, fps: FPS, config: { damping, stiffness: 180, mass: 0.6 } });
}

/** Linear 0→1 between two frames, clamped. */
export function ramp(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * Maps the scene's frame onto a demo's own millisecond timeline, piece by
 * piece, so a scene can skip the slow parts of a website demo.
 * `points` are [frame, ms] pairs in increasing frame order.
 */
export function demoTime(frame: number, points: [number, number][]) {
  return interpolate(
    frame,
    points.map(([f]) => f),
    points.map(([, ms]) => ms),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

/** Deterministic jitter for shaking things: same frame, same offset. */
export function shake(frame: number, seed: number, amount: number) {
  return (
    Math.sin(frame * 1.7 + seed * 12.9898) * amount * 0.6 +
    Math.sin(frame * 3.1 + seed * 78.233) * amount * 0.4
  );
}
