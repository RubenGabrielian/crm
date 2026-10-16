import type { ReactNode } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { pop } from "./motion";

/** Paper background with the site's faint dot grid. */
export function Paper({ dark }: { dark?: boolean }) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? "#141416" : "#eef0f3",
        backgroundImage: `radial-gradient(${dark ? "rgb(255 255 255 / 0.08)" : "rgb(20 20 22 / 0.09)"} 1.5px, transparent 1.5px)`,
        backgroundSize: "34px 34px",
      }}
    />
  );
}

/**
 * Every scene whips in from the side (alternating direction) and dips out
 * in its last frames, which makes the cuts feel fast without losing a frame
 * of the scene's own timing.
 */
export function SceneShell({
  children,
  from = "right",
  dark,
}: {
  children: ReactNode;
  from?: "right" | "left" | "up";
  dark?: boolean;
}) {
  const frame = useCurrentFrame();
  const { durationInFrames, width } = useVideoConfig();
  const enter = pop(frame, 0, 16);
  const exit = interpolate(frame, [durationInFrames - 7, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const distance = (1 - enter) * width * 0.35;
  const offset =
    from === "up"
      ? `translateY(${distance}px)`
      : `translateX(${from === "right" ? distance : -distance}px)`;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Paper dark={dark} />
      <AbsoluteFill
        style={{
          transform: `${offset} scale(${1 - exit * 0.06})`,
          opacity: 1 - exit * 0.9,
          filter: `blur(${(1 - enter) * 10 + exit * 6}px)`,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
