"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

/**
 * Shown right after Lemon Squeezy sends the buyer back: the webhook may land a
 * few seconds later, so keep reloading until the page sees Pro.
 */
export function PaymentPending() {
  const router = useRouter();

  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      tries += 1;
      if (tries > 20) window.clearInterval(id);
      else router.refresh();
    }, 3000);
    return () => window.clearInterval(id);
  }, [router]);

  return (
    <section className="flex items-center gap-3 rounded-xl bg-card p-5 shadow-soft">
      <LoaderCircle className="size-5 shrink-0 animate-spin text-muted-foreground" aria-hidden />
      <p className="text-sm">
        Վճարումը ստացվել է։ Ակտիվացնում ենք Pro-ն, դա կտևի մի քանի վայրկյան…
      </p>
    </section>
  );
}
