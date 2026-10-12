import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BellRing,
  Check,
  GraduationCap,
  Link2,
  Megaphone,
  Quote,
  Package,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { CountUp } from "@/components/landing/count-up";
import { Reveal } from "@/components/landing/reveal";
import { REVIEWS } from "@/config/reviews";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mardouk – պատվերներ, պահեստ և մաքուր շահույթ մեկ տեղում",
  description:
    "Instagram-ով վաճառող փոքր բիզնեսների համար. պատվերներ, պահեստ, հաճախորդներ, ծախսեր և իրական մաքուր շահույթ՝ առանց Excel-ի։",
};

/** Delay for one step of the hero entrance sequence. */
const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

const PILL =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <noscript>
        <style>{".reveal{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <header className="flex h-20 items-center justify-between gap-4">
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
        <nav className="flex items-center gap-2">
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
        </nav>
      </header>

      <main className="flex flex-col gap-24 pt-6 pb-16 sm:gap-28 sm:pt-12">
        {/* ── Hero ───────────────────────────────────────── */}
        <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="animate-rise inline-flex rounded-full bg-card px-3.5 py-1.5 text-sm font-medium shadow-soft">
              Instagram-ով վաճառող բիզնեսների համար
            </p>
            <h1
              style={delay(80)}
              className="animate-rise mt-5 text-4xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Իմացեք, թե իրականում որքան եք վաստակում
            </h1>
            <p
              style={delay(160)}
              className="animate-rise mt-5 max-w-xl text-lg text-muted-foreground"
            >
              Պատվերները, պահեստը, հաճախորդները և ծախսերը՝ մեկ տեղում։ Mardouk-ը
              ինքն է հաշվում մաքուր շահույթը և ցույց տալիս, թե որտեղ է գնում ձեր
              գումարը։
            </p>
            <div
              style={delay(240)}
              className="animate-rise mt-8 flex flex-wrap gap-3"
            >
              <Link
                href="/auth/register"
                className={`${PILL} bg-primary text-primary-foreground hover:bg-primary/85`}
              >
                Սկսել հիմա
                <ArrowUpRight className="size-5" aria-hidden />
              </Link>
              <a
                href="#features"
                className={`${PILL} bg-card shadow-soft hover:bg-muted`}
              >
                Տեսնել հնարավորությունները
              </a>
            </div>
            <ul
              style={delay(320)}
              className="animate-rise mt-8 flex flex-col gap-2 text-sm text-muted-foreground"
            >
              {[
                "Գրանցում էլ. փոստով, առանց գաղտնաբառի",
                "Ապրանքների և դասընթացների համար",
                "Ամբողջությամբ հայերեն",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-foreground" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <ProfitPreview />
        </section>

        {/* ── The problem ───────────────────────────────── */}
        <Reveal as="section">
          <SectionTitle
            title="Ծանո՞թ է"
            text="Փոքր բիզնեսների մեծ մասը գումար է կորցնում ոչ թե վատ վաճառքի, այլ անտեսանելի ծախսերի պատճառով։"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Պատվերները կորչում են նամակների մեջ",
                text: "Instagram DM, զանգեր, գրառումներ տետրում. մի օր ինչ-որ պատվեր մոռացվում է, և հաճախորդը հեռանում է։",
              },
              {
                title: "Վաճառք կա, բայց գումար չի մնում",
                text: "Առաքում, ինքնարժեք, գովազդ, փաթեթավորում, վարձ. առանց հաշվարկի դժվար է հասկանալ՝ շահո՞ւմ եք, թե՞ ոչ։",
              },
              {
                title: "Excel-ը միշտ հետ է մնում",
                text: "Աղյուսակը պետք է ձեռքով թարմացնել, այն հեշտ է սխալվում և չի ասում, թե պահեստում ինչ է մնացել հիմա։",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="rounded-3xl bg-card p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1"
              >
                <h3 className="text-lg font-semibold text-balance">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.text}
                </p>
              </article>
            ))}
          </div>
        </Reveal>

        {/* ── Features ──────────────────────────────────── */}
        <Reveal as="section" id="features" className="scroll-mt-8">
          <SectionTitle
            title="Ինչ է տալիս Mardouk-ը"
            text="Այն ամենը, ինչ պետք է վաճառքը կառավարելու և աճելու համար։"
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Feature
              icon={Link2}
              tone="bg-apricot"
              title="Պատվեր մեկ հղումով"
              text="Յուրաքանչյուր ապրանք ունի իր վճարման էջը։ Ուղարկեք հղումը հաճախորդին, և պատվերն ինքը կհայտնվի ձեր ցանկում։"
            />
            <Feature
              icon={ShoppingBag}
              title="Բոլոր պատվերները մեկ տեղում"
              text="Կարգավիճակ, զեղչ, առաքման արժեք, աղբյուր. փոխեք մեկ սեղմումով, ավելացրեք պատվեր ձեռքով, երբ պետք է։"
            />
            <Feature
              icon={Warehouse}
              title="Պահեստ, որն ինքն է հաշվում"
              text="Ամեն պատվեր նվազեցնում է մնացորդը։ Տեսեք՝ որքան է մուտքագրվել, վաճառվել, նվիրվել և որքան է մնացել։"
            />
            <Feature
              icon={Users}
              title="Հաճախորդների բազա"
              text="Յուրաքանչյուր գնորդ պահպանվում է իր պատվերների պատմությամբ, հեռախոսով, էլ. հասցեով և Instagram-ով։"
            />
            <Feature
              icon={Receipt}
              tone="bg-[#fde8cd]"
              title="Ծախսերի հաշվառում"
              text="Գովազդ, նյութեր, փաթեթավորում, վարձ. գրանցեք մեկանգամյա և ամսական ծախսերը, որպեսզի ոչինչ չմոռացվի։"
            />
            <Feature
              icon={BellRing}
              title="Ծանուցում հաճախորդին"
              text="Երբ փոխում եք պատվերի կարգավիճակը, հաճախորդը ստանում է նամակ. ավելի քիչ հարցեր, ավելի շատ վստահություն։"
            />
          </div>
        </Reveal>

        {/* ── Where the money goes ──────────────────────── */}
        <Reveal
          as="section"
          className="grid items-center gap-8 rounded-[2rem] bg-card p-6 shadow-soft sm:p-10 lg:grid-cols-2"
        >
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Գտեք, թե որտեղ եք կորցնում գումար
            </h2>
            <p className="mt-4 text-muted-foreground">
              Վահանակը ցույց է տալիս ոչ միայն վաճառքը, այլև այն ամենը, ինչ
              հանվում է դրանից, մինչև մնա իրական շահույթը։
            </p>
            <ul className="mt-6 flex flex-col gap-4">
              {[
                {
                  icon: TrendingUp,
                  title: "Մաքուր շահույթ և շահութաբերություն",
                  text: "Մուտքից հանվում են ինքնարժեքը, առաքումը, մարքեթինգը և մնացած ծախսերը։",
                },
                {
                  icon: Megaphone,
                  title: "Գովազդի արդյունավետություն",
                  text: "ROAS և CAC. տեսեք՝ գովազդի յուրաքանչյուր դրամը որքան է բերում, և որքան արժե մեկ պատվերը։",
                },
                {
                  icon: Package,
                  title: "Որ ապրանքն է իրոք շահութաբեր",
                  text: "Յուրաքանչյուր ապրանքի վաճառքը և համախառն շահույթը՝ կողք կողքի։",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric
              tone="bg-apricot"
              label="ROAS"
              value="9×"
              note="Մուտքը՝ գովազդի 1 ֏-ի դիմաց"
            />
            <Metric
              tone="bg-[#fde8cd]"
              label="CAC"
              value="1 350 ֏"
              note="Մեկ պատվերի գինը"
            />
            <Metric
              tone="bg-[#d5f0e3]"
              label="Շահութաբերություն"
              value="31%"
              note="Մաքուր շահույթ / մուտք"
            />
            <Metric
              tone="bg-muted"
              label="Միջին պատվեր"
              value="12 150 ֏"
              note="Առաքված պատվերներից"
            />
            <p className="col-span-2 text-xs text-muted-foreground">
              Թվերը օրինակ են։ Ձեր վահանակում կլինեն ձեր բիզնեսի իրական
              տվյալները։
            </p>
          </div>
        </Reveal>

        {/* ── Worked examples ───────────────────────────── */}
        <Reveal as="section">
          <SectionTitle
            title="Օրինակներ գործնականում"
            text="Երկու տիպիկ իրավիճակ, որոնք ցույց են տալիս, թե ինչ է երևում, երբ բոլոր թվերը մեկ տեղում են։ Սրանք օրինակելի սցենարներ են, ոչ թե իրական հաճախորդների տվյալներ։"
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <Example
              icon={Package}
              kind="Խաղալիքների առցանց խանութ"
              title="Վաճառքը մեծ էր, շահույթը՝ փոքր"
              story="Ամսական 620 000 ֏ վաճառք։ Տետրում հաշվելիս շահույթը թվում էր 250 000 ֏։ Երբ առաքումը, գովազդը և փաթեթավորումը գրանցվեցին, պատկերը փոխվեց։"
              revenue={620000}
              lines={[
                { label: "Ինքնարժեք", amount: 310000 },
                { label: "Առաքում", amount: 74000 },
                { label: "Գովազդ", amount: 95000 },
                { label: "Փաթեթավորում և այլ", amount: 45000 },
              ]}
              takeaway="Առաքումը ներառվեց գնի մեջ, իսկ գովազդը կենտրոնացվեց ամենաշահութաբեր ապրանքի վրա։"
            />
            <Example
              icon={GraduationCap}
              kind="Անգլերենի դասընթացներ"
              title="Լիքը խմբեր, բայց վարձը «ուտում» էր շահույթը"
              story="Երեք խումբ, ամսական 540 000 ֏ մուտք։ Վարձակալությունը և դասախոսների վճարը գրանցվում էին առանձին և երբեք չէին համադրվում մուտքի հետ։"
              revenue={540000}
              lines={[
                { label: "Դասախոսների վճար", amount: 240000 },
                { label: "Վարձակալություն", amount: 150000 },
                { label: "Գովազդ", amount: 60000 },
                { label: "Նյութեր", amount: 20000 },
              ]}
              takeaway="Ամսական ծախսերը գրանցելուց հետո պարզ դարձավ, որ չորրորդ խումբը նույն տարածքում կրկնապատկում է շահույթը։"
            />
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

        {/* ── How it works ──────────────────────────────── */}
        <Reveal as="section">
          <SectionTitle
            title="Ինչպես սկսել"
            text="Երեք քայլ, և առաջին պատվերն արդեն համակարգում է։"
          />
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Գրանցվեք",
                text: "Մուտքագրեք ընկերության անունը և էլ. հասցեն, ընտրեք բիզնեսի տեսակը։",
              },
              {
                title: "Ավելացրեք ապրանքները",
                text: "Գին, ինքնարժեք, առաքման արժեք և առկա քանակ. մեկ ձև յուրաքանչյուր ապրանքի համար։",
              },
              {
                title: "Ուղարկեք հղումը",
                text: "Պատճենեք ապրանքի հղումը և ուղարկեք հաճախորդին։ Մնացածը համակարգն ինքը կհաշվի։",
              },
            ].map((step, index) => (
              <li
                key={step.title}
                className="rounded-3xl bg-card p-6 shadow-soft"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground tabular-nums">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {step.text}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ── Who it is for ─────────────────────────────── */}
        <Reveal as="section">
          <SectionTitle
            title="Ում համար է"
            text="Համակարգը հարմարվում է ձեր բիզնեսի տեսակին. տեսնում եք միայն այն, ինչ ձեզ պետք է։"
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Audience
              icon={Package}
              title="Ֆիզիկական ապրանքներ"
              examples="Խաղալիքներ, հագուստ, սնունդ, ձեռագործ իրեր"
              points={[
                "Պահեստի մնացորդ",
                "Առաքման արժեք և հասցե",
                "Ինքնարժեք և շահույթ ըստ ապրանքի",
              ]}
            />
            <Audience
              icon={GraduationCap}
              title="Ծառայություններ և դասընթացներ"
              examples="Լեզվի դպրոց, խորհրդատվություն, մարզումներ"
              points={[
                "Դասընթացներ՝ դասախոսով և խմբի չափով",
                "Գրանցումներ՝ պատվերների փոխարեն",
                "Ծախսեր և մաքուր շահույթ",
              ]}
            />
          </div>
        </Reveal>

        {/* ── Final call to action ──────────────────────── */}
        <Reveal
          as="section"
          className="rounded-[2rem] bg-primary px-6 py-14 text-center text-primary-foreground sm:px-10"
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Թողեք Excel-ը և տեսեք ձեր բիզնեսի իրական պատկերը
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
            Գրանցումը տևում է մեկ րոպե։ Ավելացրեք առաջին ապրանքը և ուղարկեք
            առաջին հղումը հենց այսօր։
          </p>
          <Link
            href="/auth/register"
            className={`${PILL} mt-8 bg-apricot text-primary hover:bg-apricot/85 focus-visible:ring-offset-primary`}
          >
            Գրանցվել
            <ArrowUpRight className="size-5" aria-hidden />
          </Link>
        </Reveal>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t py-8 text-sm text-muted-foreground">
        <span>© Mardouk</span>
        <Link href="/auth/login" className="hover:text-foreground">
          Մուտք գործել
        </Link>
      </footer>
    </div>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-2xl">
      <h2 className="text-3xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      <p className="mt-3 text-muted-foreground">{text}</p>
    </div>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
  tone = "bg-card",
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  tone?: string;
}) {
  return (
    <article
      className={`rounded-3xl p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1 ${tone}`}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-75">{text}</p>
    </article>
  );
}

function Metric({
  tone,
  label,
  value,
  note,
}: {
  tone: string;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className={`rounded-3xl p-5 ${tone}`}>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-6 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-xs opacity-70">{note}</p>
    </div>
  );
}

function Audience({
  icon: Icon,
  title,
  examples,
  points,
}: {
  icon: LucideIcon;
  title: string;
  examples: string;
  points: string[];
}) {
  return (
    <article className="rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-apricot text-primary">
        <Icon className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{examples}</p>
      <ul className="mt-5 flex flex-col gap-2.5 text-sm">
        {points.map((point) => (
          <li key={point} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

/** Illustrative version of the dashboard's "how net profit is reached" panel. */
function ProfitPreview() {
  const lines: { label: string; value: string; kind?: "total" | "final" }[] = [
    { label: "Ընդհանուր մուտք", value: "486 000 ֏" },
    { label: "Ապրանքների ինքնարժեք", value: "−212 000 ֏" },
    { label: "Առաքման ծախս", value: "−38 000 ֏" },
    { label: "Համախառն շահույթ", value: "236 000 ֏", kind: "total" },
    { label: "Մարքեթինգ", value: "−54 000 ֏" },
    { label: "Գործառնական ծախսեր", value: "−31 000 ֏" },
    { label: "Մաքուր շահույթ", value: "151 000 ֏", kind: "final" },
  ];

  return (
    <div style={delay(200)} className="animate-rise">
      <div className="animate-float rounded-[2rem] bg-card p-5 shadow-panel sm:p-7">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-apricot p-5">
            <p className="text-sm font-medium">Մաքուր շահույթ</p>
            <p className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              <CountUp value={151000} suffix=" ֏" />
            </p>
          </div>
          <div className="rounded-3xl bg-[#fde8cd] p-5">
            <p className="text-sm font-medium">Նոր պատվերներ</p>
            <p className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
              <CountUp value={12} duration={900} />
            </p>
          </div>
        </div>

        <h2 className="mt-6 text-base font-semibold">
          Ինչպես է ստացվում մաքուր շահույթը
        </h2>
        <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm tabular-nums">
          {lines.map((line, index) => {
            const rule = line.kind ? "border-t pt-2" : "";
            const weight =
              line.kind === "final"
                ? "text-base font-semibold"
                : line.kind === "total"
                  ? "font-medium"
                  : "";
            return (
              <div key={line.label} className="contents">
                <dt
                  style={delay(500 + index * 110)}
                  className={`animate-rise ${rule} ${weight || "text-muted-foreground"}`}
                >
                  {line.label}
                </dt>
                <dd
                  style={delay(500 + index * 110)}
                  className={`animate-rise text-right ${rule} ${weight}`}
                >
                  {line.value}
                </dd>
              </div>
            );
          })}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          Օրինակ՝ մեկ ամսվա տվյալներով
        </p>
      </div>
    </div>
  );
}

/**
 * A worked scenario: revenue, what gets taken out of it, and what is left.
 * The bars grow when the section scrolls into view (see Reveal).
 */
function Example({
  icon: Icon,
  kind,
  title,
  story,
  revenue,
  lines,
  takeaway,
}: {
  icon: LucideIcon;
  kind: string;
  title: string;
  story: string;
  revenue: number;
  lines: { label: string; amount: number }[];
  takeaway: string;
}) {
  const net = revenue - lines.reduce((sum, line) => sum + line.amount, 0);
  const share = (amount: number) => `${Math.round((amount / revenue) * 100)}%`;
  const bar =
    "block h-2.5 w-0 rounded-full transition-[width] duration-1000 ease-out group-data-[visible=true]:w-(--w) motion-reduce:w-(--w)";

  return (
    <article className="flex flex-col rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <p className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
          <Icon className="size-4" strokeWidth={1.75} aria-hidden />
        </span>
        {kind}
      </p>
      <h3 className="mt-4 text-xl font-semibold text-balance">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{story}</p>

      <dl className="mt-6 flex flex-col gap-3 text-sm">
        <div>
          <div className="flex justify-between gap-4 font-medium">
            <dt>Մուտք</dt>
            <dd className="tabular-nums">
              <CountUp value={revenue} suffix=" ֏" />
            </dd>
          </div>
          <span className="mt-1.5 block rounded-full bg-muted">
            <span
              style={{ "--w": "100%" } as CSSProperties}
              className={`${bar} bg-primary`}
            />
          </span>
        </div>
        {lines.map((line, index) => (
          <div key={line.label}>
            <div className="flex justify-between gap-4 text-muted-foreground">
              <dt>{line.label}</dt>
              <dd className="tabular-nums">−{formatMoney(line.amount)}</dd>
            </div>
            <span className="mt-1.5 block rounded-full bg-muted">
              <span
                style={
                  {
                    "--w": share(line.amount),
                    transitionDelay: `${150 + index * 120}ms`,
                  } as CSSProperties
                }
                className={`${bar} bg-foreground/35`}
              />
            </span>
          </div>
        ))}
        <div className="mt-1 rounded-2xl bg-apricot p-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-medium">Մաքուր շահույթ</dt>
            <dd className="text-xl font-semibold tabular-nums">
              <CountUp value={net} suffix=" ֏" />
            </dd>
          </div>
          <p className="mt-0.5 text-xs opacity-70">Մուտքի {share(net)}-ը</p>
        </div>
      </dl>

      <p className="mt-5 border-t pt-4 text-sm">
        <span className="font-semibold">Ինչ փոխվեց. </span>
        {takeaway}
      </p>
    </article>
  );
}
