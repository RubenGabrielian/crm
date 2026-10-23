import type { ReactNode } from "react";
import { ProGate } from "@/components/billing/pro-gate";
import { Header } from "./header";
import { NavigationProvider, PageContent } from "./navigation-progress";
import { Sidebar } from "./sidebar";

/**
 * A floating white sidebar card on a neutral canvas; pages are made of
 * white rounded cards that sit directly on the same canvas.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <NavigationProvider>
      <div className="min-h-dvh">
        <Sidebar className="fixed inset-y-3 left-3 z-40 hidden rounded-3xl shadow-soft lg:flex" />
        <div className="flex min-h-dvh flex-col lg:pl-[16.75rem]">
          <Header />
          <main className="flex-1 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-10">
            {/* A page marked data-wide (the catalog table) may use the full width. */}
            <div className="mx-auto w-full max-w-6xl has-[[data-wide]]:max-w-none">
              <PageContent>
                <ProGate>{children}</ProGate>
              </PageContent>
            </div>
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
}
