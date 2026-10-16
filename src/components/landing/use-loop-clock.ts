"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The clock behind a scripted demo. It only runs while the demo is on
 * screen and not paused; with reduced motion it stays on `frozen`, a moment
 * chosen so the still picture tells the whole story.
 */
export function useLoopClock<E extends HTMLElement = HTMLDivElement>({
  end,
  frozen,
  loop = true,
  startVisible = false,
  manual = false,
}: {
  /** Length of one loop, in milliseconds. */
  end: number;
  /** The moment shown when motion is reduced. */
  frozen: number;
  /** false: play once and stay on the last frame. */
  loop?: boolean;
  /** true for demos that are on screen when the page opens. */
  startVisible?: boolean;
  /** true when the caller supplies the time itself (the promo video). */
  manual?: boolean;
}) {
  const ref = useRef<E>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [inView, setInView] = useState(startVisible);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        threshold: 0.25,
      },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const finished = !loop && t >= end;

  useEffect(() => {
    if (manual || !playing || !inView || reduced || finished) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      // Cap the step so a throttled background tab doesn't skip the story.
      const step = Math.min(now - last, 200);
      last = now;
      setT((value) =>
        loop ? (value + step) % end : Math.min(value + step, end),
      );
    }, 50);
    return () => window.clearInterval(id);
  }, [manual, playing, inView, reduced, finished, loop, end]);

  return { ref, t: reduced ? frozen : t, playing, setPlaying, reduced };
}
