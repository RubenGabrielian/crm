"use client";

import { useRef, useState } from "react";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

/**
 * One line of text cut off with "…" when it doesn't fit. Hovering shows the
 * full text in a tooltip, but only when it was actually cut off.
 */
export function TruncatedText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <TooltipPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        const el = ref.current;
        setOpen(next && !!el && el.scrollWidth > el.clientWidth);
      }}
    >
      <TooltipPrimitive.Trigger
        delay={300}
        render={<span ref={ref} className={cn("truncate", className)} />}
      >
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner side="top" sideOffset={8} className="z-50">
          <TooltipPrimitive.Popup className="max-w-80 origin-(--transform-origin) rounded-lg bg-foreground px-3 py-2 text-sm leading-snug text-background shadow-md transition-[opacity,transform] duration-100 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            {children}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
