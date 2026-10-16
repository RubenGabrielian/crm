import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthShowcase } from "./auth-showcase";

/**
 * Layout of the sign-in, sign-up and business-setup pages: the form on the
 * left, the live product demo on the right (wide screens only).
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="relative flex flex-col px-5 py-6 sm:px-10">
        <div
          aria-hidden
          className="dot-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-80"
        />
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground"
            >
              M
            </span>
            Mardouk
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Գլխավոր էջ
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </main>

        <footer className="text-xs text-muted-foreground">© Mardouk</footer>
      </div>

      <aside className="hidden p-3 lg:block">
        <div className="sticky top-3 h-[calc(100dvh-1.5rem)]">
          <AuthShowcase />
        </div>
      </aside>
    </div>
  );
}
