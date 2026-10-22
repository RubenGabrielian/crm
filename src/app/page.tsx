import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Link2,
  Quote,
  ShoppingBag,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { BeforeAfter } from "@/components/landing/before-after";
import { ChatFaq } from "@/components/landing/chat-faq";
import {
  LinkDemo,
  OrdersDemo,
  ProfitDemo,
  StockDemo,
} from "@/components/landing/feature-demos";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HeroShowcase } from "@/components/landing/hero-showcase";
import { Pricing } from "@/components/landing/pricing";
import { Reveal } from "@/components/landing/reveal";
import { SalePipeline } from "@/components/landing/sale-pipeline";
import { REVIEWS } from "@/config/reviews";

export const metadata: Metadata = {
  title: "Numa – Վաճառեք Instagram-ում, հաշվարկը թողեք մեզ",
  description:
    "Պատվեր մեկ հղումով, պահեստ և նյութեր, հաճախորդներ, ծախսեր և իրական մաքուր շահույթ՝ մեկ տեղում։ Instagram-ով վաճառող խանութների համար, 13 000 ֏ ամսական՝ 30 օրվա երաշխիքով։",
};

/** Delay for one step of the hero entrance sequence. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

const FAQ = [
  {
    q: "Բարև, ի՞նչ է պետք սկսելու համար",
    a: "Միայն էլ. հասցե։ Նշում եք բիզնեսի անունը և տեսակը՝ ապրանքներ կամ դասընթացներ։ Մուտքը կոդով է, գաղտնաբառ պետք չէ։",
  },
  {
    q: "Որքա՞ն արժե",
    a: "13 000 ֏ ամսական։ Բոլոր հնարավորությունները ներառված են, ավելի թանկ փաթեթներ կամ լրացուցիչ մոդուլներ չկան։",
  },
  {
    q: "Իսկ եթե չհավանե՞մ",
    a: "Օգտագործեք Numa-ը 30 օր։ Եթե չհավանեք, գրեք մեզ, և կվերադարձնենք ձեր վճարած գումարը։",
  },
  {
    q: "Հաճախորդս պե՞տք է գրանցվի կամ հավելված տեղադրի",
    a: "Ոչ։ Բացում է ձեր հղումը, լրացնում անունը, հեռախոսը և հասցեն, և պատվիրում։ Պատվերն անմիջապես հայտնվում է ձեր ցանկում։",
  },
  {
    q: "Ունեմ Excel՝ պատվերներով։ Կարո՞ղ եմ տեղափոխել",
    a: "Այո։ Գրեք մեզ, կօգնենք ներմուծել պատվերները, հաճախորդներին, ծախսերը և պահեստը, որպեսզի վիճակագրությունը սկսվի ձեր իրական պատմությունից։",
  },
  {
    q: "Ինչպե՞ս եք հաշվում մաքուր շահույթը",
    a: "Վաճառքից (առանց առաքման վճարի) հանվում են ինքնարժեքը և նյութերը, հետո՝ մարքեթինգը։ Մնացած ծախսերը երևում են առանձին։",
  },
  {
    q: "Ես դասընթացներ եմ անցկացնում, ինձ մոտ պահեստ չկա",
    a: "Գրանցվելիս ընտրեք «ծառայություններ». պատվերների փոխարեն կլինեն գրանցումներ, դասընթացներ՝ դասախոսով և խմբի չափով, առանց պահեստի։",
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6">
          <Logo priority className="h-9 sm:h-11" />
          <nav
            aria-label="Էջի բաժիններ"
            className="hidden items-center gap-7 text-sm whitespace-nowrap lg:flex"
          >
            {[
              ["#features", "Հնարավորություններ"],
              ["#how", "Ինչպես է աշխատում"],
              ["#pricing", "Բաժանորդագրություն"],
              ["#faq", "Հարցեր"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:underline"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <Link
              href="/auth/login"
              className="rounded-xl px-3.5 py-2 text-sm font-medium outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
            >
              Մուտք
            </Link>
            <Link
              href="/auth/register"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Գրանցվել
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-36 px-4 pt-6 pb-20 sm:px-6 sm:pt-10">
        {/* ── Hero: a real sale, on the customer's phone and yours ── */}
        <HeroShowcase>
          {/* Long Armenian words: set smaller than a short slogan and broken
              after "՝", so each line reads as one thought. */}
          <h1 className="animate-rise mx-auto max-w-3xl text-[1.7rem] leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl xl:text-[2.4rem]">
            <span className="block">Մեկ բաժանորդագրություն՝</span>
            <span className="block">բիզնեսիդ ամբողջ պատկերը տեսնելու համար</span>
          </h1>
          <p
            style={delay(120)}
            className="animate-rise mx-auto mt-6 max-w-[38rem] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg"
          >
            Գրանցիր պատվերները, հետևիր պահեստի մնացորդներին և վերահսկիր
            վաճառքներն ու ծախսերը մեկ հարթակում։ Numa-ն միավորում է բիզնեսիդ
            տվյալները, որպեսզի հստակ տեսնես աշխատանքի արդյունքը և կայացնես
            հիմնավորված որոշումներ։
          </p>
          <div
            style={delay(200)}
            className="animate-rise mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-medium text-primary-foreground shadow-[0_14px_30px_-14px_rgb(20_20_22/0.7)] outline-none hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Միանալ Numa-ին
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center rounded-xl border bg-card px-5 font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              Ինչպես է աշխատում
            </a>
          </div>
          <p
            style={delay(260)}
            className="animate-rise mt-4 text-sm text-muted-foreground"
          >
            Բաժանորդագրվիր և փորձիր 30 օր։ Չհավանելու դեպքում գումարդ կվերադարձնենք։
          </p>
        </HeroShowcase>

        {/* ── The problem ───────────────────────────────── */}
        <Reveal as="section">
          <SectionHeader
            title="Տետրը, DM-ները և Excel-ը՝ մեկ էկրանում"
            text="Numa-ն բիզնեսի հաշվառման և կառավարման հարթակ է, որտեղ կարող ես գրանցել պատվերները, կառավարել պահեստը, հետևել վճարումներին ու հաշվարկել վաճառքներն ու ծախսերը։ Բոլոր տվյալները հավաքվում են մեկ տեղում՝ օգնելով տեսնել բիզնեսիդ ամբողջ պատկերը և կայացնել հիմնավորված որոշումներ։"
            wide
          />
          <div className="mx-auto mt-12 max-w-4xl">
            <BeforeAfter />
          </div>
        </Reveal>

        {/* ── Features, each with a live demo ───────────── */}
        <section id="features" className="flex scroll-mt-24 flex-col gap-28">
          <Reveal>
            <SectionHeader
              title="Ամեն ինչ, ինչ պետք է Instagram խանութին"
              text="Ութ գործիք, որոնք կապված են իրար. պատվերը նվազեցնում է պահեստը, ծախսը փոխում է շահույթը, իսկ վահանակը ցույց է տալիս ամբողջ պատկերը։"
            />
            <div className="mt-12">
              <FeatureGrid />
            </div>
          </Reveal>
          <FeatureRow
            icon={Link2}
            label="Պատվեր հղումով"
            points={[
              "Սահմանիր զեղչն ու առաքման արժեքը։",
              "Ստացիր պատվերի տվյալները մեկ տեղում։",
              "Հաճախորդը պատվիրում է առանց գրանցվելու կամ հավելված ներբեռնելու։",
            ]}
            demo={<LinkDemo />}
          />
          <FeatureRow
            flip
            icon={ShoppingBag}
            label="Պատվերներ"
            points={[
              "Վճարման եղանակ և վճարման կարգավիճակ",
              "Մեկնաբանություն յուրաքանչյուր պատվերի համար",
              "Զանգով կամ նամակով ստացած պատվերի գրանցում",
            ]}
            demo={<OrdersDemo />}
          />
          <FeatureRow
            icon={Warehouse}
            label="Պահեստ և նյութեր"
            points={[
              "Նյութերի հաշվառում",
              "Պատվերը գրանցելիս ապրանքների և նյութերի մնացորդներն ավտոմատ թարմացվում են",
              "Պատվերը ջնջելիս ապրանքներն ու նյութերն ավտոմատ վերադառնում են պահեստ",
            ]}
            demo={<StockDemo />}
          />
          <FeatureRow
            flip
            icon={BarChart3}
            label="Վահանակ"
            points={[
              "Տես՝ որքան մաքուր շահույթ է բերում բիզնեսդ",
              "Հետևիր ծախսերին ու շահույթին՝ քո ընտրած ժամանակահատվածով",
              "Վերահսկիր մարքեթինգային բյուջեն և գնահատիր դրա արդյունքը",
            ]}
            demo={<ProfitDemo />}
          />
        </section>

        {/* ── One sale, step by step ────────────────────── */}
        <Reveal as="section" id="how" className="scroll-mt-24">
          <SectionHeader
            title="Մեկ հղում՝ երկար նամակագրության փոխարեն"
            text="Ուղարկիր հղումը, և հաճախորդն ինքնուրույն կլրացնի իր տվյալներն ու պատվերը։ Տվյալներն ավտոմատ կավելանան քո հաճախորդների բազայում։"
          />
          <div className="mt-12">
            <SalePipeline />
          </div>
        </Reveal>

        {/* ── Pricing ───────────────────────────────────── */}
        <Reveal as="section" id="pricing" className="scroll-mt-24">
          <SectionHeader
            title="Բոլոր հնարավորությունները՝ մեկ բաժանորդագրությամբ"
            text="Օգտվիր Numa-ի բոլոր գործիքներից ամսական 13 000 դրամով։ Փորձիր 30 օր. չհավանելու դեպքում գումարդ կվերադարձնենք։"
          />
          <div className="mt-12">
            <Pricing />
          </div>
        </Reveal>

        {/* ── Reviews: shown only once real ones are added ── */}
        {REVIEWS.length > 0 && (
          <Reveal as="section">
            <SectionHeader
              title="Ինչ են ասում օգտատերերը"
              text="Մեր հաճախորդների խոսքերը։"
            />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((review) => (
                <figure
                  key={`${review.name}-${review.business}`}
                  className="flex flex-col rounded-3xl bg-card p-6 shadow-soft"
                >
                  <Quote className="size-6 text-[#185aef]" aria-hidden />
                  <blockquote className="mt-4 flex-1 text-sm">
                    {review.text}
                  </blockquote>
                  <figcaption className="mt-5 text-sm">
                    <span className="block font-semibold">{review.name}</span>
                    <span className="block text-muted-foreground">
                      {review.business}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        )}

        {/* ── FAQ as a chat ─────────────────────────────── */}
        <Reveal as="section" id="faq" className="scroll-mt-24">
          <SectionHeader
            title="Գրեք՝ կպատասխանենք"
            text="Ամենահաճախ տրվող հարցերը։ Սեղմեք հարցի վրա։"
          />
          <div className="mt-12">
            <ChatFaq items={FAQ} />
          </div>
        </Reveal>

        {/* ── Final call to action ──────────────────────── */}
        <Reveal as="section" className="relative">
          <div
            aria-hidden
            className="dot-grid pointer-events-none absolute -inset-x-6 -inset-y-16 -z-10 sm:-inset-x-16"
          />
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Ձեր առաջին պատվերը՝ այսօր
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
              Գրանցվեք, ավելացրեք ապրանքը և ուղարկեք հղումը։ Եթե 30 օրում
              չհավանեք, գումարը կվերադարձնենք։
            </p>
            <div className="mx-auto mt-9 flex max-w-xl flex-col gap-3 rounded-2xl border bg-card p-2 shadow-soft sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm">
                <Link2
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="shrink-0 text-muted-foreground">numa.am/</span>
                <span className="cta-caret truncate font-medium">
                  ձեր-ապրանքը
                </span>
              </span>
              <Link
                href="/auth/register"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Միանալ Numa-ին
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Արդեն ունե՞ք հաշիվ։{" "}
              <Link
                href="/auth/login"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Մուտք գործել
              </Link>
            </p>
          </div>
        </Reveal>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 text-sm text-muted-foreground sm:px-6">
          <Logo className="h-9" />
          <span className="flex flex-wrap gap-x-6 gap-y-2">
            <a href="#features" className="hover:text-foreground">
              Հնարավորություններ
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Գինը
            </a>
            <Link href="/auth/login" className="hover:text-foreground">
              Մուտք գործել
            </Link>
          </span>
          <span>© Numa</span>
        </div>
      </footer>
    </div>
  );
}

function Logo({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href="/"
      className="flex items-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Image
        src="/logo.webp"
        alt="Numa"
        width={1133}
        height={254}
        priority={priority}
        className={cn("w-auto", className)}
      />
    </Link>
  );
}

function SectionHeader({
  title,
  text,
  wide,
}: {
  title: string;
  text: string;
  /** For a longer text: a wider column, so it doesn't run down the page. */
  wide?: boolean;
}) {
  return (
    <div className={cn("mx-auto text-center", wide ? "max-w-3xl" : "max-w-2xl")}>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </h2>
      <p
        className={cn(
          "mx-auto mt-4 text-muted-foreground sm:text-lg",
          wide ? "max-w-[44rem] leading-relaxed text-pretty" : "max-w-xl",
        )}
      >
        {text}
      </p>
    </div>
  );
}

function FeatureRow({
  icon: Icon,
  label,
  title,
  text,
  points,
  demo,
  flip,
}: {
  icon: LucideIcon;
  label: string;
  /** Optional: without a title and text the row is just the points. */
  title?: string;
  text?: string;
  points: string[];
  demo: ReactNode;
  /** Demo on the left instead of the right. */
  flip?: boolean;
}) {
  return (
    <Reveal
      className={cn(
        "grid items-center gap-10 lg:gap-16",
        flip ? "lg:grid-cols-[1.2fr_0.8fr]" : "lg:grid-cols-[0.8fr_1.2fr]",
      )}
    >
      <div className={flip ? "lg:order-2" : undefined}>
        {/* Without a title, the label pill is the row's heading. */}
        {title ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </span>
        ) : (
          <h3 className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-soft">
            <Icon className="size-3.5" aria-hidden />
            {label}
          </h3>
        )}
        {title && (
          <h3 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h3>
        )}
        {text && <p className="mt-4 text-muted-foreground sm:text-lg">{text}</p>}
        <ul
          className={cn(
            "flex flex-col",
            title ? "mt-7 gap-3" : "mt-6 gap-5 text-lg sm:text-xl",
          )}
        >
          {points.map((point) => (
            <li key={point} className="flex gap-3">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground",
                  title ? "mt-0.5" : "mt-1",
                )}
              >
                <Check className="size-3" strokeWidth={3} aria-hidden />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className={flip ? "lg:order-1" : undefined}>{demo}</div>
    </Reveal>
  );
}
