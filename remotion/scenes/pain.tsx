import { useCurrentFrame } from "remotion";
import { Caption } from "../ui/caption";
import { Fit } from "../ui/layout";
import { pop, shake } from "../ui/motion";
import { NotebookCard, StickyNote } from "../ui/props";
import { SceneShell } from "../ui/scene";

/** 3–6 s. Three quick questions nobody can answer from a notebook. */
export function PainScene() {
  const frame = useCurrentFrame();
  const cut = Math.min(Math.floor(frame / 30), 2);
  const local = frame - cut * 30;
  const punch = pop(local, 0, 12);

  return (
    <SceneShell from="right">
      <Caption
        text="Պատվերները՝ DM-ում, հաշիվը՝ տետրում"
        accent={["DM-ում", "տետրում"]}
      />
      <Fit w={560} h={620}>
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-8"
          style={{ transform: `scale(${1.18 - punch * 0.18})`, opacity: Math.min(punch * 2, 1) }}
        >
          {cut === 0 && (
            <>
              <NotebookCard
                style={{ transform: "rotate(-4deg)", width: 380 }}
                lines={[
                  { text: "Անի — 2 արջ — 19 800" },
                  { text: "Մարիամ — արջ — ?" },
                  { text: "Գոռ — կավե — ուրբաթ", crossed: true },
                  { text: "Նարե — վճարե՞ց", red: true },
                ]}
              />
              <Question>Ո՞վ է վճարել</Question>
            </>
          )}
          {cut === 1 && (
            <>
              <div className="flex items-end gap-5">
                <StickyNote text="տոպրակ — ?" style={{ transform: "rotate(-5deg)" }} />
                <StickyNote text="պիտակ — վերջացա՞վ" style={{ transform: "rotate(4deg)" }} />
              </div>
              <Question>Քանի՞ տոպրակ է մնացել</Question>
            </>
          )}
          {cut === 2 && (
            <div className="flex flex-col items-center gap-6">
              <span className="text-[44px] font-semibold tracking-tight text-foreground">
                Իրական շահույթ =
              </span>
              <span
                className="text-[150px] leading-none font-bold text-[#e11d48]"
                style={{ transform: `rotate(${shake(frame, 2, 4)}deg)` }}
              >
                ???
              </span>
            </div>
          )}
        </div>
      </Fit>
    </SceneShell>
  );
}

function Question({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#141416] px-7 py-3.5 text-[36px] font-semibold text-white shadow-[0_20px_40px_-18px_rgb(20_20_22/0.6)]">
      {children}
    </span>
  );
}
