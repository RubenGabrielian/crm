import { interpolate, useCurrentFrame } from "remotion";
import { ProfitDemo } from "@/components/landing/feature-demos";
import { Caption } from "../ui/caption";
import { Camera, Fit } from "../ui/layout";
import { demoTime, pop, ramp } from "../ui/motion";
import { SceneShell } from "../ui/scene";

/** 22–26 s. The website's dashboard demo, then +9 630 ֏ flies into the profit tile. */
export function ProfitScene() {
  const frame = useCurrentFrame();
  const t = demoTime(frame, [
    [0, 0],
    [48, 2600],
  ]);
  // Close on the numbers, back out for the +9 630, then onto break-even.
  const zoom = interpolate(frame, [4, 16, 40, 52, 86, 98], [1, 1.25, 1.25, 1, 1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const focusY = frame < 70 ? 0.22 : 0.86;
  const focusX = frame < 70 ? 0.5 : 0.27;
  const fly = ramp(frame, 56, 74);
  const appear = pop(frame, 52);
  const glow = ramp(frame, 74, 90);

  return (
    <SceneShell from="right">
      <Caption text="Իրական մաքուր շահույթ" accent={["մաքուր"]} />
      <Fit w={480} h={600}>
        <Camera zoom={zoom} x={focusX} y={focusY}>
          <div className="relative">
            <ProfitDemo time={t} />
            {/* The profit from Ani's order joining the month */}
            {frame >= 52 && frame < 80 && (
              <span
                className="absolute rounded-full bg-[#10b981] px-4 py-2 text-[20px] font-bold whitespace-nowrap text-white shadow-[0_14px_30px_-10px_rgb(16_185_129/0.8)] tabular-nums"
                style={{
                  left: "50%",
                  top: `${88 - fly * 66}%`,
                  transform: `translate(-50%, -50%) scale(${appear * (1 - fly * 0.5)})`,
                  opacity: 1 - ramp(frame, 72, 80),
                }}
              >
                +9 630 ֏
              </span>
            )}
            {frame >= 74 && (
              <span
                className="pointer-events-none absolute top-[16%] left-[37%] h-[14%] w-[26%] rounded-2xl border-4 border-[#10b981]"
                style={{ opacity: 1 - glow, transform: `scale(${1 + glow * 0.25})` }}
              />
            )}
          </div>
        </Camera>
      </Fit>
    </SceneShell>
  );
}
