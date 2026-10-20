import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const PRICE = 13000;

// The same points as the feature rows on the page, so both say one thing.
const INCLUDED: { title: string; items: string[] }[] = [
  {
    title: "Պատվերներ",
    items: [
      "Սահմանիր զեղչն ու առաքման արժեքը",
      "Ստացիր պատվերի տվյալները մեկ տեղում",
      "Հաճախորդը պատվիրում է առանց գրանցվելու կամ հավելված ներբեռնելու",
      "Վճարման եղանակ և վճարման կարգավիճակ",
      "Մեկնաբանություն յուրաքանչյուր պատվերի համար",
      "Զանգով կամ նամակով ստացած պատվերի գրանցում",
    ],
  },
  {
    title: "Պահեստ",
    items: [
      "Նյութերի հաշվառում",
      "Պատվերը գրանցելիս ապրանքների և նյութերի մնացորդներն ավտոմատ թարմացվում են",
      "Պատվերը ջնջելիս ապրանքներն ու նյութերն ավտոմատ վերադառնում են պահեստ",
    ],
  },
  {
    title: "Վահանակ",
    items: [
      "Տես՝ որքան մաքուր շահույթ է բերում բիզնեսդ",
      "Հետևիր ծախսերին ու շահույթին՝ քո ընտրած ժամանակահատվածով",
      "Վերահսկիր մարքեթինգային բյուջեն և գնահատիր դրա արդյունքը",
    ],
  },
];

export function Pricing() {
  return (
    <div className="grid overflow-hidden rounded-[2.25rem] shadow-[0_40px_90px_-50px_rgb(20_20_22/0.55)] ring-1 ring-black/5 lg:grid-cols-[0.95fr_1.05fr]">
      {/* Price and guarantee */}
      <div className="relative overflow-hidden bg-primary p-7 text-primary-foreground sm:p-10">
        <div
          aria-hidden
          className="dot-grid-dark pointer-events-none absolute inset-0"
        />
        <div className="relative">
          <p className="text-sm text-primary-foreground/60">
            Մեկ փաթեթ՝ բոլոր հնարավորություններով
          </p>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl">
              13 000
            </span>
            <span className="text-xl text-primary-foreground/70">֏ / ամիս</span>
          </p>
          <p className="mt-2 text-sm text-primary-foreground/60">
            Օրական՝ մոտ {Math.round(PRICE / 30)} ֏
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-apricot px-6 font-medium text-foreground outline-none hover:bg-apricot/85 focus-visible:ring-2 focus-visible:ring-apricot focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Սկսել հիմա
            <ArrowRight className="size-4" aria-hidden />
          </Link>

          <div className="mt-8 flex items-center gap-5 rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10 sm:p-5">
            <GuaranteeSeal className="size-24 shrink-0 sm:size-28" />
            <p className="text-sm">
              <span className="block text-base font-semibold text-white">
                30 օրվա երաշխիք
              </span>
              <span className="mt-1 block text-primary-foreground/70">
                Օգտագործեք Numa-ը 30 օր։ Եթե չհավանեք, կվերադարձնենք ձեր
                վճարած գումարը։
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* What is included */}
      <div className="bg-card p-7 sm:p-10">
        <p className="text-lg font-semibold">Ամեն ինչ ներառված է</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Լրացուցիչ մոդուլներ կամ ավելի թանկ փաթեթներ չկան։
        </p>
        <div className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2">
          {INCLUDED.map((group, index) => (
            // The long first group fills the left column; the rest stack right.
            <div key={group.title} className={index === 0 ? "sm:row-span-2" : undefined}>
              <p className="text-sm font-medium text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <Check className="size-3" strokeWidth={3} aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A round stamp whose text ring turns slowly. */
function GuaranteeSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      <defs>
        <path
          id="guarantee-ring"
          d="M60 60 m-45 0 a45 45 0 1 1 90 0 a45 45 0 1 1 -90 0"
        />
      </defs>
      <circle cx="60" cy="60" r="59" fill="#fed740" />
      <circle cx="60" cy="60" r="35" fill="#141416" />
      <g className="seal-spin">
        <text fill="#141416" fontSize="9.5" fontWeight="600">
          <textPath
            href="#guarantee-ring"
            textLength="276"
            lengthAdjust="spacing"
          >
            գումարի վերադարձ • 30 օր երաշխիք •
          </textPath>
        </text>
      </g>
      <text
        x="60"
        y="61"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="24"
        fontWeight="700"
      >
        30
      </text>
      <text x="60" y="76" textAnchor="middle" fill="#fed740" fontSize="10">
        օր
      </text>
    </svg>
  );
}
