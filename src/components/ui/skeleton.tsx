import { cn } from "cn";

/** A shimmering placeholder block; size it with className. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("skeleton", className)} {...props} />;
}
