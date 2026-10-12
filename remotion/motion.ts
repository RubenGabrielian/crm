import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

type SpringConfig = { damping?: number; stiffness?: number; mass?: number };

/** A 0→1 spring that starts `from` frames into the current scene. */
export function useAt(from: number, config?: SpringConfig) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - from,
    fps,
    config: { damping: 15, stiffness: 150, mass: 0.7, ...config },
  });
}

/** Linear 0→1 between two frames, clamped. */
export function useRamp(from: number, to: number) {
  return interpolate(useCurrentFrame(), [from, to], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/** Types `text` one character every `speed` frames, starting at `from`. */
export function useTyped(text: string, from: number, speed = 2) {
  const frame = useCurrentFrame();
  const count = Math.max(0, Math.min(text.length, Math.floor((frame - from) / speed)));
  return { value: text.slice(0, count), typing: frame >= from && count < text.length };
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Style for something that pops up into place as `progress` goes 0→1. */
export function rise(progress: number, distance = 50) {
  return {
    opacity: Math.min(progress, 1),
    transform: `translateY(${(1 - progress) * distance}px)`,
  };
}

export function pop(progress: number, from = 0.7) {
  return {
    opacity: Math.min(progress, 1),
    transform: `scale(${interpolate(progress, [0, 1], [from, 1])})`,
  };
}

export function formatNumber(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
