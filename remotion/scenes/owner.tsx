import { interpolate, useCurrentFrame } from "remotion";
import { Mail } from "lucide-react";
import { PhoneFrame } from "@/components/landing/devices";
import { OwnerScreen, saleStateAt } from "@/components/landing/sale-story";
import { Caption } from "../ui/caption";
import { Camera, Fit } from "../ui/layout";
import { demoTime, pop, ramp, shake } from "../ui/motion";
import { SceneShell } from "../ui/scene";

/** 16–19 s. The owner's phone buzzes, the order lands, it goes "delivered" and the email flies out. */
export function OwnerScene() {
  const frame = useCurrentFrame();
  // Hero timeline (ms): banner 6700, stock 7500, tap 10100, delivered 10500, email 11600.
  const t = demoTime(frame, [
    [0, 6450],
    [30, 7900],
    [44, 8150],
    [50, 10000],
    [60, 10600],
    [90, 11500],
  ]);
  const { owner, buzz } = saleStateAt(t);
  const zoom = interpolate(frame, [6, 18, 40, 52], [1, 1.25, 1.25, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fly = ramp(frame, 62, 84);
  const sent = pop(frame, 64);

  return (
    <SceneShell from="right">
      <Caption text="Նոր պատվեր՝ ակնթարթորեն" accent={["ակնթարթորեն"]} />
      <Fit w={560} h={650}>
        <div className="relative h-full w-full">
          <Camera zoom={zoom} x={0.5} y={0.3}>
            <div className="flex justify-center pt-[16px]">
              <div style={{ transform: buzz ? `rotate(${shake(frame, 1, 3)}deg)` : undefined }}>
                <PhoneFrame>
                  <OwnerScreen {...owner} />
                </PhoneFrame>
              </div>
            </div>
          </Camera>

          {/* The "delivered" email leaving for the customer */}
          {frame >= 62 && (
            <span
              className="absolute flex size-16 items-center justify-center rounded-2xl bg-[#10b981] text-white shadow-[0_18px_40px_-12px_rgb(16_185_129/0.7)]"
              style={{
                left: 330 + fly * 260,
                top: 170 - fly * 150 - Math.sin(fly * Math.PI) * 60,
                opacity: 1 - ramp(frame, 80, 86),
                transform: `rotate(${fly * 25}deg)`,
              }}
            >
              <Mail className="size-8" />
            </span>
          )}
          <span
            className="absolute bottom-[40px] left-1/2 flex items-center gap-2.5 rounded-full bg-[#141416] px-5 py-3 text-[18px] font-semibold whitespace-nowrap text-white shadow-lg"
            style={{ opacity: sent, transform: `translateX(-50%) translateY(${(1 - sent) * 20}px)` }}
          >
            <Mail className="size-5 text-[#fed740]" />
            Նամակ ուղարկվեց Անիին
          </span>
        </div>
      </Fit>
    </SceneShell>
  );
}
