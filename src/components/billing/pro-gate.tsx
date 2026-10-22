"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "cn";
import { isActivePath } from "@/config/navigation";
import { BILLING_PATH, FREE_PATHS } from "@/lib/billing/limits";
import { useIsPro } from "@/lib/billing/pro-context";

/**
 * Free accounts use a few pages fully (FREE_PATHS). Every other page is shown
 * as a demo: the pages fill themselves with sample data for free accounts
 * (see demo-data.ts), and this frame labels it, makes it inert and sends a
 * click anywhere on it to the pay page.
 */
export function ProGate({ children }: { children: ReactNode }) {
  const isPro = useIsPro();
  const pathname = usePathname();
  if (isPro || FREE_PATHS.some((path) => isActivePath(pathname, path))) {
    return children;
  }
  const pitch =
    Object.entries(DEMO_PITCH).find(([path]) => isActivePath(pathname, path))?.[1] ??
    "Ակտիվացրու Pro-ն, որ այս էջում տեսնես քո իրական տվյալները և աշխատես դրանցով։";
  return <DemoFrame pitch={pitch}>{children}</DemoFrame>;
}

/** What each demo page would give the seller with Pro. */
const DEMO_PITCH: Record<string, string> = {
  "/dashboard":
    "Pro-ով այստեղ կտեսնես քո իրական վաճառքը, ինքնարժեքը, զուտ շահույթը, զրոյական կետը և որ աղբյուրից են գալիս պատվերները։",
  "/inventory":
    "Pro-ով կհետևես յուրաքանչյուր ապրանքի և նյութի մնացորդին․ վաճառքն ու նվերներն ինքնաբերաբար կհանվեն պահեստից։",
  "/customers":
    "Pro-ով կունենաս բոլոր հաճախորդների բազան՝ պատվերների քանակով, ծախսած գումարով, հասցեներով և նշումներով։",
  "/reinvestments":
    "Pro-ով կգրանցես, թե որքան ես ներդնում բիզնեսի մեջ և որ ապրանքի համար։",
};

function DemoFrame({ pitch, children }: { pitch: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="sticky top-20 z-20 flex flex-col gap-4 rounded-xl bg-primary p-5 text-primary-foreground shadow-soft sm:flex-row sm:items-center sm:p-6">
        <span className="w-fit shrink-0 rounded-full bg-apricot px-3 py-1 text-xs font-semibold tracking-wide text-foreground uppercase">
          Դեմո
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">
            Սա դեմո տարբերակ է՝ օրինակ-տվյալներով
          </p>
          <p className="mt-0.5 text-sm text-primary-foreground/75">{pitch}</p>
        </div>
        <Link
          href={BILLING_PATH}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-apricot px-5 text-sm font-medium text-foreground outline-none hover:bg-apricot/85 focus-visible:ring-2 focus-visible:ring-apricot focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
        >
          Ակտիվացնել Pro
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <div className="relative">
        {/* The sample page: visible, but nothing in it can be used. */}
        <div inert className="pointer-events-none select-none opacity-80">
          {children}
        </div>
        <Link
          href={BILLING_PATH}
          tabIndex={-1}
          aria-label="Ակտիվացնել Pro"
          className="absolute inset-0 z-10 cursor-pointer"
        />
      </div>
    </div>
  );
}

/** Lock icon, short text and a button to the pay page. */
export function UpgradePrompt({
  title,
  description,
  action = "Ակտիվացնել Pro",
  compact = false,
  className,
}: {
  title: string;
  description: string;
  action?: string;
  /** For dialogs: no card background, smaller padding. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col items-center text-center",
        compact ? "py-2" : "rounded-xl bg-card px-6 py-16 shadow-soft sm:px-10",
        className,
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-apricot text-foreground">
        <Lock className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-balance">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-balance text-muted-foreground">
        {description}
      </p>
      <Link
        href={BILLING_PATH}
        className="mt-6 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {action}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </section>
  );
}
