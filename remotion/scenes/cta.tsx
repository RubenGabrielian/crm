import { useCurrentFrame } from "remotion";
import { ArrowRight, Check } from "lucide-react";
import { Caption } from "../ui/caption";
import { Fit } from "../ui/layout";
import { pop } from "../ui/motion";
import { GuaranteeSeal, NumaLogo } from "../ui/props";
import { SceneShell } from "../ui/scene";

/** 26–30 s. Price, the 30-day guarantee, the button and the address. */
export function CtaScene() {
  const frame = useCurrentFrame();
  const card = pop(frame, 4, 13);
  const seal = pop(frame, 16, 9);
  const button = pop(frame, 26);
  const url = pop(frame, 36);
  const pulse = 1 + Math.max(0, Math.sin((frame - 40) / 6)) * 0.035;

  return (
    <SceneShell from="up" dark>
      <Caption
        text="30 օր՝ գումարի վերադարձի երաշխիքով"
        accent={["30", "օր՝"]}
        dark
        delay={10}
        scale={0.8}
      />
      <Fit w={520} h={600}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-7">
          <div
            className="relative w-full rounded-[2rem] bg-white p-8 text-[#141416] shadow-[0_40px_90px_-30px_rgb(17_40_110/0.7)]"
            style={{ transform: `translateY(${(1 - card) * 60}px) scale(${0.9 + card * 0.1})`, opacity: card }}
          >
            <NumaLogo size={46} />
            <p className="mt-7 text-[17px] text-muted-foreground">
              Մեկ փաթեթ՝ բոլոր հնարավորություններով
            </p>
            <p className="mt-2 flex items-baseline gap-3">
              <span className="text-[86px] leading-none font-semibold tracking-tight tabular-nums">
                13 000
              </span>
              <span className="text-[26px] text-muted-foreground">֏ / ամիս</span>
            </p>
            <ul className="mt-6 flex flex-col gap-2.5 text-[18px]">
              {["Պատվեր մեկ հղումով", "Պահեստ և նյութեր", "Մաքուր շահույթ"].map((item, index) => {
                const p = pop(frame, 14 + index * 4);
                return (
                  <li
                    key={item}
                    className="flex items-center gap-3"
                    style={{ opacity: p, transform: `translateX(${(1 - p) * 20}px)` }}
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                );
              })}
            </ul>
            <div
              className="absolute -top-12 -right-8"
              style={{ transform: `scale(${seal}) rotate(${(1 - seal) * -40}deg)` }}
            >
              <GuaranteeSeal size={150} rotation={frame * 2.4} />
            </div>
          </div>

          <span
            className="flex h-[76px] w-full items-center justify-center gap-3 rounded-2xl bg-[#fed740] text-[30px] font-semibold text-[#141416]"
            style={{ opacity: button, transform: `scale(${(0.85 + button * 0.15) * pulse})` }}
          >
            Ստեղծել խանութը
            <ArrowRight className="size-8" />
          </span>
          <span
            className="text-[40px] font-semibold tracking-tight text-white"
            style={{ opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}
          >
            numa.am
          </span>
        </div>
      </Fit>
    </SceneShell>
  );
}
