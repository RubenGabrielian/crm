import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  Link2,
  Megaphone,
  Quote,
  Receipt,
  ShoppingBag,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { DetailTabs } from "@/components/landing/detail-tabs";
import { FlowDemo } from "@/components/landing/flow-demo";
import { HeroDemo } from "@/components/landing/hero-demo";
import { Reveal } from "@/components/landing/reveal";
import { REVIEWS } from "@/config/reviews";

export const metadata: Metadata = {
  title: "Mardouk – Instagram խանութը՝ հղումից մինչև մաքուր շահույթ",
  description:
    "Պատվեր մեկ հղումով, պահեստ և նյութեր, հաճախորդներ, ծախսեր և իրական մաքուր շահույթ՝ մեկ տեղում։ Instagram-ով վաճառող բիզնեսների համար, ամբողջությամբ հայերեն։",
};

/** Delay for one step of the hero entrance sequence. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

const PILL =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function LandingPage() {
  return (
    <div className="relative overflow-x-clip">
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>

      {/* Soft colour glow behind the hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem]"
      >
        <span className="glow-blob absolute -top-24 right-[8%] size-[32rem] rounded-full bg-[#c9bcff]/60 blur-3xl" />
        <span className="glow-blob absolute top-40 right-[34%] size-[22rem] rounded-full bg-[#bfeedd]/70 blur-3xl [animation-delay:-6s]" />
        <span className="glow-blob absolute top-10 -left-24 size-[26rem] rounded-full bg-[#fde3cf]/70 blur-3xl [animation-delay:-11s]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-transparent bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground"
            >
              M
            </span>
            Mardouk
          </Link>
          <nav
            aria-label="Էջի բաժիններ"
            className="hidden items-center gap-1 text-sm md:flex"
          >
            {[
              ["#modules", "Հնարավորություններ"],
              ["#flow", "Ինչպես է աշխատում"],
              ["#faq", "Հարցեր"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="rounded-full px-3.5 py-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-full px-4 py-2 text-sm font-medium outline-none hover:bg-card focus-visible:ring-2 focus-visible:ring-ring"
            >
              Մուտք
            </Link>
            <Link
              href="/auth/register"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Գրանցվել
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-28 px-4 pt-10 pb-20 sm:px-6 sm:pt-16">
        {/* ── Hero ───────────────────────────────────────── */}
        <section className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
          <div>
            <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-white/80 bg-card/80 px-3.5 py-1.5 text-sm font-medium shadow-soft backdrop-blur">
              <span aria-hidden className="size-2 rounded-full bg-ring" />
              Instagram-ով վաճառող բիզնեսների համար
            </p>
            <h1
              style={delay(80)}
              className="animate-rise mt-6 text-[2.6rem] leading-[1.12] font-semibold tracking-tight text-balance sm:text-6xl sm:leading-[1.08]"
            >
              Ձեր խանութը՝ հղումից մինչև{" "}
              <span className="relative whitespace-nowrap">
                <span
                  aria-hidden
                  className="marker absolute inset-x-[-0.15em] bottom-[0.08em] top-[0.18em] -z-10 rounded-xl bg-apricot"
                />
                մաքուր շահույթ
              </span>
            </h1>
            <p
              style={delay(160)}
              className="animate-rise mt-6 max-w-xl text-lg text-muted-foreground"
            >
              Պատվերներ, պահեստ և նյութեր, հաճախորդներ, ծախսեր և վճարումներ՝ մեկ
              տեղում։ Առանց Excel-ի և առանց DM-ում կորած պատվերների։
            </p>
            <div
              style={delay(240)}
              className="animate-rise mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/auth/register"
                className={`${PILL} bg-primary text-primary-foreground shadow-[0_12px_30px_-12px_rgb(20_20_22/0.6)] hover:bg-primary/85`}
              >
                Սկսել հիմա
                <ArrowUpRight className="size-5" aria-hidden />
              </Link>
              <a
                href="#flow"
                className={`${PILL} bg-card shadow-soft hover:bg-muted`}
              >
                Ինչպես է աշխատում
              </a>
            </div>
            <ul
              style={delay(320)}
              className="animate-rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"
            >
              {[
                "Գրանցում 1 րոպեում",
                "Աշխատում է հեռախոսում",
                "Ամբողջությամբ հայերեն",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-emerald-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div style={delay(200)} className="animate-rise min-w-0">
            <HeroDemo />
          </div>
        </section>

        {/* ── Modules ───────────────────────────────────── */}
        <Reveal as="section" id="modules" className="scroll-mt-24">
          <SectionTitle
            title="Ձեր խանութի առօրյան՝ մեկ համակարգում"
            text="Ութ մոդուլ, որոնք կապված են իրար. նույն տվյալը երկու անգամ մուտքագրելու կարիք չկա։"
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Module
              index={0}
              icon={Link2}
              tone="bg-violet-100 text-violet-700"
              title="Պատվեր մեկ հղումով"
              text="Յուրաքանչյուր ապրանք ունի իր էջը։ Զեղչն ու առաքումը՝ հենց հղման մեջ։"
            >
              <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-xs">
                <span className="truncate text-muted-foreground">
                  mardouk.am/checkout/…
                </span>
                <span className="ml-auto shrink-0 rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
                  −15%
                </span>
              </div>
            </Module>
            <Module
              index={1}
              icon={ShoppingBag}
              tone="bg-amber-100 text-amber-800"
              title="Պատվերներ և կարգավիճակներ"
              text="Կարգավիճակը, աղբյուրը և վճարումը փոխվում են անմիջապես աղյուսակից։"
            >
              <div className="flex flex-wrap gap-1.5 text-[11px] font-medium">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
                  Նոր
                </span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-900">
                  Հաստատված
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-900">
                  Առաքված
                </span>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-rose-900">
                  Չվճարված
                </span>
              </div>
            </Module>
            <Module
              index={2}
              icon={Users}
              tone="bg-sky-100 text-sky-800"
              title="Հաճախորդներ"
              text="Պատվերների պատմություն, Instagram, մեկնաբանություն և «ամենաշատ գնողները»։"
            >
              <div className="flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-sky-200 text-xs font-semibold">
                  Լ
                </span>
                <span className="text-xs">
                  <span className="block font-medium">Լիլիթ Ա.</span>
                  <span className="block text-muted-foreground">
                    6 պատվեր · 74 400 ֏
                  </span>
                </span>
              </div>
            </Module>
            <Module
              index={3}
              icon={Warehouse}
              tone="bg-emerald-100 text-emerald-800"
              title="Պահեստ և նյութեր"
              text="Վաճառքը հանում է ապրանքը և նրա նյութերը՝ տոպրակ, պիտակ, լցոն։"
            >
              <div className="flex flex-col gap-1.5 text-xs">
                <MiniBar label="Արարատ" value="71" share={0.24} />
                <MiniBar label="Տոպրակ" value="−2" share={0.56} />
              </div>
            </Module>
            <Module
              index={4}
              icon={Receipt}
              tone="bg-orange-100 text-orange-800"
              title="Ծախսեր"
              text="Ֆիքսված և փոփոխական, ամսական կրկնվող, վճարված կամ դեռ ոչ։"
            >
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <span className="rounded-xl bg-sky-100 px-2.5 py-1.5 text-sky-900">
                  Ֆիքսված
                  <span className="block font-semibold tabular-nums">
                    100 000 ֏
                  </span>
                </span>
                <span className="rounded-xl bg-violet-100 px-2.5 py-1.5 text-violet-900">
                  Փոփոխական
                  <span className="block font-semibold tabular-nums">
                    42 300 ֏
                  </span>
                </span>
              </div>
            </Module>
            <Module
              index={5}
              icon={BarChart3}
              tone="bg-violet-100 text-violet-700"
              title="Մաքուր շահույթ"
              text="Վաճառք − ինքնարժեք − մարքեթինգ. և որ օրն եք դուրս եկել զրոյի։"
            >
              <div className="rounded-xl bg-muted px-3 py-2">
                <span className="block text-[11px] text-muted-foreground">
                  Մաքուր շահույթ
                </span>
                <span className="block text-lg font-semibold tracking-tight tabular-nums">
                  186 400 ֏
                </span>
              </div>
            </Module>
            <Module
              index={6}
              icon={Megaphone}
              tone="bg-rose-100 text-rose-800"
              title="Որտեղից են գալիս պատվերները"
              text="Instagram DM, Meta Ads կամ խանութ. տեսեք, որն է իրոք աշխատում։"
            >
              <div className="flex flex-col gap-1.5 text-xs">
                <MiniBar label="Instagram DM" value="65%" share={0.65} />
                <MiniBar label="Meta Ads" value="23%" share={0.23} />
              </div>
            </Module>
            <Module
              index={7}
              icon={Bell}
              tone="bg-teal-100 text-teal-800"
              title="Ծանուցումներ"
              text="Նոր պատվերի նշան ձեզ, և նամակ հաճախորդին, երբ փոխվում է կարգավիճակը։"
            >
              <div className="rounded-xl bg-muted px-3 py-2 text-xs">
                <span className="block font-medium">Ձեր պատվերն առաքված է</span>
                <span className="block truncate text-muted-foreground">
                  Բարև, Անի։ Պատվեր #4F2A…
                </span>
              </div>
            </Module>
          </div>
        </Reveal>

        {/* ── One order, end to end ─────────────────────── */}
        <Reveal
          as="section"
          id="flow"
          className="-mx-4 scroll-mt-20 bg-gradient-to-b from-transparent via-[#e6e3f7]/60 to-transparent px-4 py-4 sm:-mx-6 sm:px-6"
        >
          <SectionTitle
            title="Հղումից մինչև մաքուր շահույթ"
            text="Պատվերը, պահեստը, վճարումը և շահույթը կապված են իրար։ Հետևեք մեկ պատվերի ճանապարհին։"
            center
          />
          <div className="mt-10">
            <FlowDemo />
          </div>
        </Reveal>

        {/* ── Details ───────────────────────────────────── */}
        <Reveal as="section">
          <SectionTitle
            title="Ճշգրիտ՝ մինչև մանրուքը"
            text="Փոքր բաներ, որոնք Excel-ում ամենից հաճախ մոռացվում են։"
            center
          />
          <div className="mt-10">
            <DetailTabs />
          </div>
        </Reveal>

        {/* ── Reviews: shown only once real ones are added ── */}
        {REVIEWS.length > 0 && (
          <Reveal as="section">
            <SectionTitle
              title="Ինչ են ասում օգտատերերը"
              text="Մեր հաճախորդների խոսքերը։"
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {REVIEWS.map((review) => (
                <figure
                  key={`${review.name}-${review.business}`}
                  className="flex flex-col rounded-3xl bg-card p-6 shadow-soft"
                >
                  <Quote className="size-6 text-violet-600" aria-hidden />
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

        {/* ── Getting started ───────────────────────────── */}
        <Reveal
          as="section"
          className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start"
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Սկսում եք նույն օրը
            </h2>
            <p className="mt-4 text-muted-foreground">
              Ունե՞ք Excel կամ Google Sheet՝ պատվերներով և ծախսերով։ Գրեք մեզ, և
              կօգնենք տեղափոխել տվյալները, որպեսզի վահանակը առաջին օրվանից ցույց
              տա ձեր իրական պատկերը։
            </p>
          </div>
          <ol className="grid gap-3">
            {[
              {
                title: "Գրանցվեք",
                text: "Ընկերության անունը, ձեր անունը և էլ. հասցեն։ Գաղտնաբառ պետք չէ՝ մուտքը կոդով է։",
              },
              {
                title: "Ավելացրեք ապրանքները և նյութերը",
                text: "Գին, ինքնարժեք, առկա քանակ և ինչ նյութեր է ծախսում ամեն վաճառքը։",
              },
              {
                title: "Ուղարկեք առաջին հղումը",
                text: "Պատճենեք ապրանքի հղումը Instagram-ում։ Պատվերները, պահեստը և շահույթը կհաշվվեն ինքնաբերաբար։",
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-3xl bg-card p-5 shadow-soft"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ── FAQ ───────────────────────────────────────── */}
        <Reveal as="section" id="faq" className="scroll-mt-24">
          <SectionTitle
            title="Հաճախակի տրվող հարցեր"
            text="Եթե պատասխան չգտաք՝ գրեք մեզ։"
            center
          />
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-3xl bg-card px-6 shadow-soft open:pb-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium outline-none focus-visible:underline [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </Reveal>

        {/* ── Final call to action ──────────────────────── */}
        <Reveal
          as="section"
          className="relative overflow-hidden rounded-[2.25rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-10"
        >
          <span
            aria-hidden
            className="glow-blob absolute -top-24 -left-16 size-80 rounded-full bg-[#8b6ff7]/45 blur-3xl"
          />
          <span
            aria-hidden
            className="glow-blob absolute -right-16 -bottom-28 size-80 rounded-full bg-[#3fbf95]/30 blur-3xl [animation-delay:-8s]"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Տեսեք ձեր խանութի իրական պատկերը
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              Գրանցումը տևում է մեկ րոպե։ Ավելացրեք առաջին ապրանքը և ուղարկեք
              առաջին հղումը հենց այսօր։
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/register"
                className={`${PILL} bg-apricot text-primary hover:bg-apricot/85 focus-visible:ring-offset-primary`}
              >
                Սկսել հիմա
                <ArrowUpRight className="size-5" aria-hidden />
              </Link>
              <Link
                href="/auth/login"
                className={`${PILL} bg-white/10 hover:bg-white/15 focus-visible:ring-offset-primary`}
              >
                Ունեմ հաշիվ
              </Link>
            </div>
          </div>
        </Reveal>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 border-t px-4 py-8 text-sm text-muted-foreground sm:px-6">
        <span>© Mardouk</span>
        <span className="flex gap-4">
          <a href="#modules" className="hover:text-foreground">
            Հնարավորություններ
          </a>
          <Link href="/auth/login" className="hover:text-foreground">
            Մուտք գործել
          </Link>
        </span>
      </footer>
    </div>
  );
}

const FAQ = [
  {
    q: "Ինչ է պետք սկսելու համար",
    a: "Միայն էլ. հասցե։ Գրանցվելիս նշում եք բիզնեսի անունը և տեսակը՝ ապրանքներ կամ դասընթացներ, իսկ մուտքը կատարվում է էլ. փոստով ստացված կոդով։",
  },
  {
    q: "Հաճախորդը պե՞տք է գրանցվի կամ որևէ հավելված տեղադրի",
    a: "Ոչ։ Հաճախորդը բացում է ձեր ուղարկած հղումը, լրացնում անունը, հեռախոսը և հասցեն, ընտրում քանակը և պատվիրում։ Պատվերն անմիջապես հայտնվում է ձեր ցանկում։",
  },
  {
    q: "Կարո՞ղ եմ տեղափոխել իմ Excel-ի տվյալները",
    a: "Այո։ Գրեք մեզ, և կօգնենք ներմուծել պատվերները, հաճախորդներին, ծախսերը և պահեստի մնացորդը, որպեսզի վիճակագրությունը սկսվի ձեր իրական պատմությունից։",
  },
  {
    q: "Ինչպե՞ս է հաշվվում մաքուր շահույթը",
    a: "Վաճառքից (առանց առաքման վճարի) հանվում են ապրանքների ինքնարժեքը և օգտագործված նյութերը, հետո՝ մարքեթինգի ծախսերը։ Մնացած ծախսերը և անձնական ծախսերը ցույց են տրվում առանձին։",
  },
  {
    q: "Աշխատո՞ւմ է հեռախոսում",
    a: "Այո։ Բոլոր էջերը հարմարեցված են հեռախոսին. կարող եք փոխել պատվերի կարգավիճակը կամ պատճենել հղումը հենց ճանապարհին։",
  },
  {
    q: "Հարմա՞ր է դասընթացների և ծառայությունների համար",
    a: "Այո։ Գրանցվելիս ընտրեք «ծառայություններ», և պատվերների փոխարեն կտեսնեք գրանցումներ, դասընթացներ՝ դասախոսով և խմբի չափով, առանց պահեստի։",
  },
];

function SectionTitle({
  title,
  text,
  center,
}: {
  title: string;
  text: string;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground">{text}</p>
    </div>
  );
}

function Module({
  index,
  icon: Icon,
  tone,
  title,
  text,
  children,
}: {
  index: number;
  icon: LucideIcon;
  tone: string;
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <article
      style={{ "--i": index } as CSSProperties}
      className="module-card flex flex-col rounded-3xl border border-white/70 bg-card p-5 shadow-soft transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgb(73_52_160/0.4)]"
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-2xl",
          tone,
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-4 font-semibold text-balance">{title}</h3>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{text}</p>
      <div className="mt-5" aria-hidden>
        {children}
      </div>
    </article>
  );
}

function MiniBar({
  label,
  value,
  share,
}: {
  label: string;
  value: string;
  share: number;
}) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-20 shrink-0 truncate text-muted-foreground">
        {label}
      </span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-ring"
          style={{ width: `${share * 100}%` }}
        />
      </span>
      <span className="w-8 text-right font-semibold tabular-nums">{value}</span>
    </span>
  );
}
