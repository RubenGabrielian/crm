import { interpolate, useCurrentFrame } from "remotion";
import { LinkDemo } from "@/components/landing/feature-demos";
import { Caption } from "../ui/caption";
import { Camera, Fit } from "../ui/layout";
import { demoTime } from "../ui/motion";
import { SceneShell } from "../ui/scene";

/** 8–12 s. The website's copy-link demo: 15 %, free delivery, copied, sent in a DM. */
export function LinkScene() {
  const frame = useCurrentFrame();
  const t = demoTime(frame, [
    [0, 400],
    [55, 2900],
    [70, 3800],
    [88, 5350],
    [120, 6000],
  ]);
  // Push in on the dialog while the numbers are typed, pull back for the DM.
  const zoom = interpolate(frame, [14, 30, 74, 90], [1, 1.2, 1.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell from="right">
      <Caption text="Մեկ հղում՝ զեղչով" accent={["զեղչով"]} />
      <Fit w={480} h={470}>
        <Camera zoom={zoom} x={0.5} y={0.48}>
          <LinkDemo time={t} />
        </Camera>
      </Fit>
    </SceneShell>
  );
}
