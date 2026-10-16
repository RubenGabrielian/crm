import { interpolate, useCurrentFrame } from "remotion";
import { StockDemo } from "@/components/landing/feature-demos";
import { Caption } from "../ui/caption";
import { Camera, Fit } from "../ui/layout";
import { demoTime } from "../ui/motion";
import { SceneShell } from "../ui/scene";

/** 19–22 s. The website's warehouse demo: every sale also uses bags, labels and filling. */
export function StockScene() {
  const frame = useCurrentFrame();
  // Demo timeline (ms): sales at 900, 3100 and 5300 (filling runs low).
  const t = demoTime(frame, [
    [0, 700],
    [22, 1700],
    [28, 3000],
    [44, 3500],
    [50, 5200],
    [74, 6300],
    [90, 6600],
  ]);
  const zoom = interpolate(frame, [48, 62, 90], [1, 1.3, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell from="left">
      <Caption text="Պահեստը նվազում է ինքը" accent={["ինքը"]} />
      <Fit w={480} h={400}>
        <Camera zoom={zoom} x={0.32} y={0.72}>
          <StockDemo time={t} />
        </Camera>
      </Fit>
    </SceneShell>
  );
}
