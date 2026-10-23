"use client";

import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  HeartHandshake,
  Receipt,
  Users,
  Warehouse,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: ClipboardList,
    title: "Առցանց գրանցում",
    text: "Ընդունիր պատվերներն ու գրանցումները մեկ հղումով։ Հաճախորդն ինքնուրույն լրացնում է անհրաժեշտ տվյալները, իսկ դու տեսնում և կառավարում ես դրանք Numa-ում։",
  },
  {
    icon: Users,
    title: "Հաճախորդների բազա",
    text: "Պահպանիր հաճախորդների տվյալներն ու պատվերների պատմությունը մեկ տեղում։ Տես՝ ով ինչ գնումներ է կատարել, որքան հաճախ է վերադառնում քեզ մոտ և ովքեր են քո ամենաակտիվ հաճախորդները։",
  },
  {
    icon: Receipt,
    title: "Ծախսերի վերահսկում",
    text: "Գրանցիր բիզնեսիդ ֆիքսված ու փոփոխական ծախսերը՝ ապրանքի ինքնարժեքից և փաթեթավորումից մինչև գովազդ։ Հետևիր՝ ինչի վրա ես ծախսում, և կառավարիր այն։",
  },
  {
    icon: Waypoints,
    title: "Վաճառքի աղբյուրների վերլուծություն",
    text: "Տես՝ որ աղբյուրներից են գալիս պատվերները։ Համադրիր գովազդային ծախսերն ու վաճառքները՝ հասկանալու համար, թե որ ուղղություններն են արդյունք տալիս։",
  },
  {
    icon: Warehouse,
    title: "Պահեստի կառավարում",
    text: "Հետևիր ապրանքների ու նյութերի մնացորդներին։ Պատվերը գրանցելիս քանակներն ավտոմատ թարմացվում են։",
  },
  {
    icon: HeartHandshake,
    title: "CRM",
    text: "Ճանաչիր հաճախորդներիդ և զարգացրու նրանց հետ հարաբերությունները։ Օգտագործիր գնումների պատմությունն ու նախասիրությունները՝ անհատական առաջարկներ անելու և կրկնակի գնումները խթանելու համար։",
  },
  {
    icon: BarChart3,
    title: "Պրոֆեսիոնալ դաշբորդ",
    text: "Տես բիզնեսիդ հիմնական ցուցանիշները մեկ էկրանին՝ վաճառքներ, պատվերներ, ծախսեր և շահույթի հաշվարկ։ Հետևիր դրանց փոփոխությանը և գնահատիր արդյունքները՝ ըստ ընտրված ժամանակահատվածի։",
  },
];

/**
 * All features, with nothing hidden behind hover. Wide screens: a list on
 * the left and the picked feature explained on the right (hover, focus or
 * click picks one). Narrow screens: the same list opens like an accordion.
 */
export function FeatureGrid() {
  const [active, setActive] = useState(0);
  const current = FEATURES[active];
  const CurrentIcon = current.icon;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6">
      <ul className="grid gap-1.5">
        {FEATURES.map(({ icon: Icon, title, text }, index) => {
          const open = index === active;
          return (
            <li
              key={title}
              className={cn(
                "rounded-2xl transition-colors",
                open && "bg-card shadow-soft",
              )}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setActive(index)}
                // Only a real mouse and the keyboard preview on the way. A tap
                // also fires enter/focus first; opening then would shift the
                // list and the tap would land on the next row.
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setActive(index);
                }}
                onFocus={(event) => {
                  if (event.currentTarget.matches(":focus-visible"))
                    setActive(index);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !open &&
                    "text-muted-foreground hover:bg-card/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    open
                      ? "bg-[#185aef] text-white"
                      : "bg-[#e8efff] text-[#185aef]",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span
                  className={cn(
                    "flex-1 font-medium",
                    open && "font-semibold text-foreground",
                  )}
                >
                  {title}
                </span>
                <ChevronDown
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 transition-transform lg:-rotate-90",
                    open && "rotate-180 lg:text-[#185aef]",
                  )}
                />
              </button>
              {/* Narrow screens: the text opens right under its row. */}
              {open && (
                <p className="-mt-1 px-4 pb-4 pl-[4.25rem] text-sm leading-relaxed text-muted-foreground lg:hidden">
                  {text}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {/* Wide screens: the picked feature, always on show. */}
      <div
        aria-live="polite"
        className="relative hidden overflow-hidden rounded-3xl bg-[#185aef] p-10 text-white lg:flex lg:flex-col"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/8"
        />
        <span className="relative flex size-16 items-center justify-center rounded-2xl bg-white/12">
          <CurrentIcon className="size-8" strokeWidth={1.5} aria-hidden />
        </span>
        <div key={active} className="feature-swap relative mt-auto pt-10">
          <p className="text-sm font-medium text-white/70 tabular-nums">
            {active + 1} / {FEATURES.length}
          </p>
          <h3 className="mt-2 text-3xl leading-tight font-semibold text-balance">
            {current.title}
          </h3>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/90">
            {current.text}
          </p>
        </div>
      </div>
    </div>
  );
}
