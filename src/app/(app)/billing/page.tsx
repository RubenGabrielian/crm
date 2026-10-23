import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, ExternalLink } from "lucide-react";
import { PaymentPending } from "@/components/billing/payment-pending";
import { Pricing, PRICING_CTA_CLASS } from "@/components/landing/pricing";
import {
  getCurrentSubscription,
  isProSubscription,
  syncSubscriptionFromLemonSqueezy,
  type Subscription,
} from "@/lib/billing/subscription";
import { requireOwner } from "@/lib/tenant/get-current-tenant";

// Depends on the signed-in user's subscription.
export const instant = false;

const dateFormat = new Intl.DateTimeFormat("hy-AM", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Yerevan",
});

export default async function BillingPage({ searchParams }: PageProps<"/billing">) {
  // The subscription is the owner's business; employees don't see it.
  await requireOwner();
  const { paid, error } = await searchParams;
  const subscription = await getCurrentSubscription();
  const isPro = isProSubscription(subscription);

  // Back from paying but no webhook yet: fetch the subscription ourselves, then
  // reload so the whole app (layout included) sees Pro.
  if (paid && !isPro && (await syncSubscriptionFromLemonSqueezy())) {
    redirect("/billing");
  }

  if (subscription && isPro) {
    return <ProStatus subscription={subscription} />;
  }

  return (
    <div className="flex flex-col gap-6">
      {paid && <PaymentPending />}
      {error && (
        <p className="rounded-3xl bg-destructive/10 p-5 text-sm text-destructive">
          Չհաջողվեց բացել վճարման էջը։ Փորձիր նորից մի փոքր ուշ։
        </p>
      )}
      <Pricing
        cta={
          // A plain POST form: the route creates the checkout and redirects to it.
          <form action="/api/billing/checkout" method="post">
            <button type="submit" className={`${PRICING_CTA_CLASS} cursor-pointer`}>
              Վճարել և ակտիվացնել
              <ArrowRight className="size-4" aria-hidden />
            </button>
          </form>
        }
      />
    </div>
  );
}

function ProStatus({ subscription }: { subscription: Subscription }) {
  const cancelled = subscription.status === "cancelled";
  const date = cancelled ? subscription.endsAt : subscription.renewsAt;

  return (
    <section className="flex flex-col items-start gap-5 rounded-3xl bg-card p-6 shadow-soft sm:p-8">
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <BadgeCheck className="size-6" strokeWidth={1.75} aria-hidden />
      </span>
      <div>
        <h2 className="text-xl font-semibold">Numa Pro-ն ակտիվ է</h2>
        {date && (
          <p className="mt-1 text-sm text-muted-foreground">
            {cancelled ? "Հասանելի է մինչև" : "Հաջորդ վճարումը՝"}{" "}
            {dateFormat.format(new Date(date))}
          </p>
        )}
        {subscription.status === "past_due" && (
          <p className="mt-2 text-sm text-destructive">
            Վերջին վճարումը չհաջողվեց։ Թարմացրու քարտի տվյալները։
          </p>
        )}
      </div>
      {subscription.customerPortalUrl && (
        <a
          href={subscription.customerPortalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          Կառավարել բաժանորդագրությունը
          <ExternalLink className="size-4" aria-hidden />
        </a>
      )}
    </section>
  );
}
