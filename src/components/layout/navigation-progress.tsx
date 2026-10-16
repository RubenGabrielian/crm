"use client";

import {
  createContext,
  Suspense,
  use,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageSkeleton } from "./page-skeletons";

/** Path being navigated to, or null when nothing is loading. */
const PendingPathContext = createContext<string | null>(null);

/**
 * Watches every in-app navigation (sidebar links, filters, sorting, search
 * forms). The moment one starts, a progress bar runs across the top and the
 * page is swapped for the destination's skeleton, so there is never a pause
 * with nothing happening while the server prepares the next page.
 */
export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  return (
    <PendingPathContext value={pendingPath}>
      <Suspense fallback={null}>
        <Progress onPendingChange={setPendingPath} />
      </Suspense>
      {children}
    </PendingPathContext>
  );
}

/** Page content, replaced by a skeleton while the next page loads. */
export function PageContent({ children }: { children: React.ReactNode }) {
  const pendingPath = use(PendingPathContext);
  return (
    <>
      {/* Kept mounted while hidden, so a cancelled navigation loses nothing. */}
      <div hidden={pendingPath !== null}>{children}</div>
      {pendingPath !== null && <PageSkeleton pathname={pendingPath} />}
    </>
  );
}

function Progress({
  onPendingChange,
}: {
  onPendingChange: (path: string | null) => void;
}) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  function clearTimers() {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  }

  // The new URL has rendered: show it, complete the bar, then hide the bar.
  useEffect(() => {
    clearTimers();
    timers.current.push(
      window.setTimeout(() => {
        onPendingChange(null);
        setProgress((current) => (current === null ? null : 1));
      }, 0),
      window.setTimeout(() => setProgress(null), 450),
    );
  }, [pathname, search, onPendingChange]);

  useEffect(() => {
    function start(target: URL) {
      const here = new URL(window.location.href);
      if (target.origin !== here.origin) return;
      if (target.pathname === here.pathname && target.search === here.search)
        return;
      // Only pages inside the app have skeletons; the rest just get the bar.
      if (
        !target.pathname.startsWith("/checkout") &&
        !target.pathname.startsWith("/auth")
      ) {
        onPendingChange(target.pathname);
        window.scrollTo({ top: 0 });
      }
      clearTimers();
      setProgress(0.12);
      // Creep towards the end without reaching it until the page arrives.
      [
        [150, 0.35],
        [600, 0.55],
        [1500, 0.72],
        [3500, 0.86],
      ].forEach(([delay, value]) =>
        timers.current.push(window.setTimeout(() => setProgress(value), delay)),
      );
      // Never leave the skeleton up if the navigation was cancelled.
      timers.current.push(
        window.setTimeout(() => {
          onPendingChange(null);
          setProgress(null);
        }, 15000),
      );
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (
        anchor.hasAttribute("download") ||
        anchor.href.startsWith("mailto:") ||
        anchor.href.startsWith("tel:")
      )
        return;
      start(new URL(anchor.href));
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || event.defaultPrevented) return;
      // Only plain GET forms navigate; server-action forms show their own state.
      if (
        form.method.toLowerCase() !== "get" ||
        typeof form.getAttribute("action") !== "string"
      )
        return;
      if (!form.checkValidity()) return;
      const url = new URL(form.action);
      const data = new FormData(form, event.submitter);
      url.search = new URLSearchParams(
        [...data.entries()].filter(
          (entry): entry is [string, string] => typeof entry[1] === "string",
        ),
      ).toString();
      start(url);
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      clearTimers();
    };
  }, [onPendingChange]);

  return (
    // Base UI marks page elements with data-base-ui-inert while a dialog or
    // menu is open; this bar hydrates late (inside Suspense), so it can find
    // that attribute already set. It isn't React's to manage, so don't warn.
    <div
      suppressHydrationWarning
      aria-hidden
      className="nav-progress"
      style={{
        transform: `scaleX(${progress ?? 0})`,
        opacity: progress === null || progress === 1 ? 0 : 1,
      }}
    />
  );
}
