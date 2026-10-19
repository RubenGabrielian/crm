import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Caption } from "../ui/caption";
import { Fit } from "../ui/layout";
import { pop, ramp } from "../ui/motion";
import { ExcelCard, NumaLogo, NotebookCard, StickyNote } from "../ui/props";
import { SceneShell } from "../ui/scene";

/** 6–8 s. The mess is swept away, ink floods in, the logo snaps into place. */
export function TurnScene() {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const sweep = ramp(frame, 0, 14);
  const flood = interpolate(frame, [6, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logo = pop(frame, 14, 10);
  const ring = ramp(frame, 16, 46);
  const radius = Math.hypot(width, height);

  return (
    <SceneShell from="left">
      {/* Chaos leaving the frame */}
      <Fit w={560} h={620}>
        <div className="relative h-full w-full">
          <div
            className="absolute top-[80px] left-[20px]"
            style={{ transform: `translate(${-sweep * 700}px, ${-sweep * 200}px) rotate(${-9 - sweep * 40}deg)` }}
          >
            <NotebookCard lines={[{ text: "Անի — 2 արջ" }, { text: "վճարե՞ց ???", red: true }]} />
          </div>
          <div
            className="absolute top-[380px] left-[290px]"
            style={{ transform: `translate(${sweep * 700}px, ${sweep * 260}px) rotate(${7 + sweep * 50}deg)` }}
          >
            <ExcelCard />
          </div>
          <div
            className="absolute top-[120px] left-[340px]"
            style={{ transform: `translate(${sweep * 600}px, ${-sweep * 400}px) rotate(${6 + sweep * 60}deg)` }}
          >
            <StickyNote text="տոպրակ ~20 մնաց?" />
          </div>
        </div>
      </Fit>

      {/* Ink floods out from the centre */}
      <AbsoluteFill
        style={{
          background: "#185aef",
          clipPath: `circle(${flood * radius * 0.6}px at 50% 50%)`,
        }}
      />
      <AbsoluteFill
        style={{
          clipPath: `circle(${flood * radius * 0.6}px at 50% 50%)`,
          backgroundImage: "radial-gradient(rgb(255 255 255 / 0.08) 1.5px, transparent 1.5px)",
          backgroundSize: "34px 34px",
        }}
      />

      {/* A yellow ring bursting behind the logo */}
      <AbsoluteFill className="items-center justify-center">
        <div
          className="rounded-full border-[6px] border-[#fed740]"
          style={{
            width: 260 + ring * 900,
            height: 260 + ring * 900,
            opacity: (1 - ring) * (frame > 16 ? 1 : 0),
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill className="items-center justify-center">
        <div style={{ transform: `scale(${0.4 + logo * 0.6})`, opacity: logo }}>
          <NumaLogo size={width > 1000 ? 150 : 120} dark />
        </div>
      </AbsoluteFill>

      <Caption text="Ծանոթացեք՝ Numa" accent={["Numa"]} delay={18} dark />
    </SceneShell>
  );
}
