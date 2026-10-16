import { interpolate, useCurrentFrame } from "remotion";
import { PhoneFrame } from "@/components/landing/devices";
import { Caption } from "../ui/caption";
import { Fit } from "../ui/layout";
import { pop, ramp, shake } from "../ui/motion";
import { ExcelCard, InboxScreen, NotebookCard, StickyNote } from "../ui/props";
import { SceneShell } from "../ui/scene";

/** 0–3 s. A phone drowning in DMs, notes and a broken spreadsheet, all shaking. */
export function HookScene() {
  const frame = useCurrentFrame();
  const unread = Math.round(interpolate(ramp(frame, 6, 58), [0, 1], [1, 37]));
  // The shaking grows as the mess piles up.
  const jitter = 1 + ramp(frame, 10, 70) * 5;
  const badge = pop(frame, 10, 9);

  return (
    <SceneShell from="up">
      <Caption text="Instagram խանութ ունե՞ք" accent={["Instagram"]} />
      <Fit w={560} h={640}>
        <div className="relative h-full w-full">
          <div
            className="absolute top-[40px] left-[142px]"
            style={{
              transform: `translate(${shake(frame, 1, jitter)}px, ${shake(frame, 2, jitter)}px) rotate(${shake(frame, 3, jitter * 0.3)}deg)`,
            }}
          >
            <PhoneFrame>
              <InboxScreen unread={unread} />
            </PhoneFrame>
          </div>

          {/* The unread counter bursting out of the phone */}
          <div
            className="absolute top-[4px] left-[330px] flex size-[104px] items-center justify-center rounded-full bg-[#ff3b5c] text-[46px] font-bold text-white shadow-[0_18px_40px_-12px_rgb(255_59_92/0.7)] tabular-nums"
            style={{ transform: `scale(${badge}) rotate(${shake(frame, 4, jitter)}deg)` }}
          >
            {unread}
          </div>

          <Prop frame={frame} delay={20} seed={5} jitter={jitter} x={-30} y={150} rotate={-9}>
            <NotebookCard
              lines={[
                { text: "Անի — 2 արջ — 19 800?" },
                { text: "Գոռ — կավե — ուրբաթ", crossed: true },
                { text: "վճարե՞ց ???", red: true },
              ]}
            />
          </Prop>
          <Prop frame={frame} delay={30} seed={6} jitter={jitter} x={300} y={430} rotate={7}>
            <ExcelCard />
          </Prop>
          <Prop frame={frame} delay={38} seed={7} jitter={jitter} x={360} y={120} rotate={6}>
            <StickyNote text="տոպրակ ~20 մնաց?" />
          </Prop>
        </div>
      </Fit>
    </SceneShell>
  );
}

function Prop({
  frame,
  delay,
  seed,
  jitter,
  x,
  y,
  rotate,
  children,
}: {
  frame: number;
  delay: number;
  seed: number;
  jitter: number;
  x: number;
  y: number;
  rotate: number;
  children: React.ReactNode;
}) {
  const p = pop(frame, delay, 11);
  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        opacity: Math.min(p * 1.5, 1),
        transform: `translate(${shake(frame, seed, jitter)}px, ${shake(frame, seed + 9, jitter)}px) rotate(${rotate + shake(frame, seed + 3, jitter * 0.4)}deg) scale(${0.6 + p * 0.4})`,
      }}
    >
      {children}
    </div>
  );
}
