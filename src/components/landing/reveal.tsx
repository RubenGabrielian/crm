"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "cn";

/**
 * Fades its content up into place the first time it scrolls into view.
 * Children can react too, through `group-data-[visible=true]:` classes.
 * The styles live in globals.css and are switched off for reduced motion.
 */
export function Reveal({
  as: Tag = "div",
  id,
  className,
  children,
}: {
  as?: "div" | "section";
  id?: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      id={id}
      data-visible={visible}
      className={cn("reveal group", className)}
    >
      {children}
    </Tag>
  );
}
