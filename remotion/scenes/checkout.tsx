import { interpolate, useCurrentFrame } from "remotion";
import { PhoneFrame } from "@/components/landing/devices";
import { CustomerScreen, saleStateAt } from "@/components/landing/sale-story";
import { Caption } from "../ui/caption";
import { Camera, Fit } from "../ui/layout";
import { demoTime } from "../ui/motion";
import { SceneShell } from "../ui/scene";

/** 12–16 s. The customer's phone: the real checkout page, filled in fast. */
export function CheckoutScene() {
  const frame = useCurrentFrame();
  // Hero timeline (ms): qty 900, typing 1400–4800, press 5150, success 5750.
  const t = demoTime(frame, [
    [0, 700],
    [8, 1300],
    [20, 1450],
    [32, 2500],
    [38, 2700],
    [48, 3600],
    [54, 3800],
    [66, 4800],
    [72, 5200],
    [78, 5800],
    [120, 6500],
  ]);
  const { customer } = saleStateAt(t);
  const zoom = interpolate(frame, [10, 24, 68, 80], [1, 1.22, 1.22, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <SceneShell from="left">
      <Caption text="Հաճախորդն ինքն է պատվիրում" accent={["ինքն"]} />
      <Fit w={300} h={580}>
        <Camera zoom={zoom} x={0.5} y={0.68}>
          <div className="flex justify-center pt-[10px]">
            <PhoneFrame>
              <CustomerScreen {...customer} />
            </PhoneFrame>
          </div>
        </Camera>
      </Fit>
    </SceneShell>
  );
}
