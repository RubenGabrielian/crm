import type { CSSProperties, ReactNode } from "react";
import { useVideoConfig } from "remotion";

export type LayoutKind = "tall" | "feed" | "square";

/**
 * Where things go in each format. "tall" is 9:16 for Reels and Stories:
 * the top 220 px and bottom 380 px are covered by Instagram's own UI, so
 * nothing important is placed there.
 */
export function useLayout() {
  const { width, height } = useVideoConfig();
  const kind: LayoutKind = height / width > 1.5 ? "tall" : height > width ? "feed" : "square";
  const box = {
    tall: { captionTop: 240, captionSize: 78, visualTop: 560, visualBottom: 1530 },
    feed: { captionTop: 70, captionSize: 64, visualTop: 300, visualBottom: 1290 },
    square: { captionTop: 50, captionSize: 54, visualTop: 230, visualBottom: 1040 },
  }[kind];
  return {
    kind,
    width,
    height,
    ...box,
    visual: {
      left: 60,
      top: box.visualTop,
      width: width - 120,
      height: box.visualBottom - box.visualTop,
    },
  };
}

/**
 * Scales a piece designed at `w`×`h` CSS pixels (website size) to fill the
 * visual area of the frame, centred.
 */
export function Fit({
  w,
  h,
  maxScale = 3,
  children,
  style,
}: {
  w: number;
  h: number;
  maxScale?: number;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const { visual } = useLayout();
  const scale = Math.min(visual.width / w, visual.height / h, maxScale);
  return (
    <div
      style={{
        position: "absolute",
        left: visual.left + (visual.width - w * scale) / 2,
        top: visual.top + (visual.height - h * scale) / 2,
        width: w,
        height: h,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Zooms into a point of its content: (x, y) are 0–1 of its own box. */
export function Camera({
  zoom,
  x = 0.5,
  y = 0.5,
  children,
}: {
  zoom: number;
  x?: number;
  y?: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `scale(${zoom})`,
        transformOrigin: `${x * 100}% ${y * 100}%`,
      }}
    >
      {children}
    </div>
  );
}
