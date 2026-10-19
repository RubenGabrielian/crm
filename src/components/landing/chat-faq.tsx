"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "cn";

type Item = { q: string; a: string };

/**
 * Questions as incoming DMs. Opening one shows a short "typing…" and then
 * the answer as Numa's reply, the way shop owners already talk to buyers.
 */
export function ChatFaq({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const [typing, setTyping] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  function toggle(index: number) {
    if (timer.current) window.clearTimeout(timer.current);
    if (open === index) {
      setOpen(null);
      return;
    }
    setOpen(index);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setTyping(true);
    timer.current = window.setTimeout(() => setTyping(false), 650);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-[2rem] border bg-card p-4 shadow-soft sm:p-6">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.q} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => toggle(index)}
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              className={cn(
                "max-w-[88%] self-start rounded-3xl rounded-bl-md px-4 py-2.5 text-left text-[15px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                isOpen ? "bg-[#e8efff]" : "bg-muted hover:bg-[#e8efff]",
              )}
            >
              {item.q}
            </button>
            <div
              id={`faq-answer-${index}`}
              hidden={!isOpen}
              className="flex flex-col items-end"
            >
              {isOpen && typing ? (
                <span
                  aria-label="Մուտքագրում է"
                  className="flex gap-1 rounded-3xl rounded-br-md bg-primary px-4 py-3.5"
                >
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="typing-dot size-1.5 rounded-full bg-primary-foreground/70"
                      style={{ animationDelay: `${dot * 140}ms` }}
                    />
                  ))}
                </span>
              ) : (
                <p className="faq-answer max-w-[88%] rounded-3xl rounded-br-md bg-primary px-4 py-3 text-[15px] text-primary-foreground">
                  {item.a}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
