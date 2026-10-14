import { cn } from "cn";
import { Skeleton } from "@/components/ui/skeleton";

// Skeletons mirror each page's real layout, so the switch to content is calm:
// cards fade up one after another and a single shimmer sweeps across all of them.

type Cell = "text" | "stack" | "thumb" | "num" | "pill" | "actions";

function Loading({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-label="Բեռնվում է" className="flex flex-col gap-6">
      {children}
      <span className="sr-only">Բեռնվում է…</span>
    </div>
  );
}

/** A white card that fades up in its turn. */
function Card({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn("sk-in rounded-3xl bg-card shadow-soft", className)}
      style={{ "--i": index } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function Pills({ count, index = 0 }: { count: number; index?: number }) {
  return (
    <div
      className="sk-in flex w-fit gap-1 rounded-full bg-card p-1 shadow-soft"
      style={{ "--i": index } as React.CSSProperties}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-8 rounded-full",
            i === 0 ? "w-24 opacity-90" : "w-20",
          )}
        />
      ))}
    </div>
  );
}

function Toolbar({
  pills = 0,
  search = false,
  button = true,
}: {
  pills?: number;
  search?: boolean;
  button?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {pills > 0 ? (
          <Pills count={pills} />
        ) : (
          <Skeleton className="h-4 w-28" />
        )}
        {search && <Skeleton className="h-10 w-64 rounded-xl" />}
      </div>
      {button && <Skeleton className="h-11 w-44 rounded-full" />}
    </div>
  );
}

// Varied widths per row read as real content instead of a grid of bars.
const WIDTHS = [
  "w-[72%]",
  "w-[55%]",
  "w-[85%]",
  "w-[63%]",
  "w-[78%]",
  "w-[50%]",
  "w-[68%]",
];

function CellSkeleton({ cell, row }: { cell: Cell; row: number }) {
  const width = WIDTHS[row % WIDTHS.length];
  switch (cell) {
    case "thumb":
      return (
        <span className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <span className="flex flex-1 flex-col gap-2">
            <Skeleton className={cn("h-3.5", width)} />
            <Skeleton className="h-3 w-1/3" />
          </span>
        </span>
      );
    case "stack":
      return (
        <span className="flex flex-col gap-2">
          <Skeleton className={cn("h-3.5", width)} />
          <Skeleton className="h-3 w-1/2" />
        </span>
      );
    case "num":
      return <Skeleton className="ml-auto h-3.5 w-16" />;
    case "pill":
      return <Skeleton className="h-6 w-24 rounded-full" />;
    case "actions":
      return (
        <span className="flex justify-end gap-1.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </span>
      );
    default:
      return <Skeleton className={cn("h-3.5", width)} />;
  }
}

function TableCard({
  cells,
  rows = 7,
  index = 1,
}: {
  cells: Cell[];
  rows?: number;
  index?: number;
}) {
  const template = cells
    .map((cell) =>
      cell === "thumb"
        ? "2.2fr"
        : cell === "stack"
          ? "1.4fr"
          : cell === "actions"
            ? "5rem"
            : "1fr",
    )
    .join(" ");
  return (
    <Card index={index} className="overflow-hidden p-3">
      <div
        className="grid items-center gap-4 rounded-2xl bg-muted px-4 py-3"
        style={{ gridTemplateColumns: template }}
      >
        {cells.map((cell, i) => (
          <Skeleton
            key={i}
            className={cn(
              "h-3",
              cell === "num" ? "ml-auto w-12" : "w-16",
            )}
          />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div
          key={row}
          className="grid items-center gap-4 border-b border-border/50 px-4 py-4 last:border-0"
          style={{ gridTemplateColumns: template }}
        >
          {cells.map((cell, i) => (
            <CellSkeleton key={i} cell={cell} row={row + i} />
          ))}
        </div>
      ))}
    </Card>
  );
}

function StatTiles({
  count,
  index = 0,
  accent = false,
}: {
  count: number;
  index?: number;
  accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <Card
          key={i}
          index={index + i}
          className={cn("p-5", accent && i === 0 && "bg-apricot/40")}
        >
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-5 h-7 w-32" />
          <Skeleton className="mt-3 h-3 w-16" />
        </Card>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading>
      <Pills count={5} />
      <StatTiles count={4} index={1} accent />
      <StatTiles count={4} index={5} />
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((card) => (
          <Card key={card} index={9 + card} className="p-6">
            <Skeleton className="h-4 w-40" />
            <div className="mt-6 flex h-52 items-end gap-2">
              {[38, 62, 45, 80, 52, 90, 58, 72, 40, 66, 84, 55].map(
                (height, i) => (
                  <Skeleton
                    key={i}
                    className="flex-1 rounded-t-lg rounded-b-sm"
                    style={{ height: `${card ? 100 - height + 20 : height}%` }}
                  />
                ),
              )}
            </div>
          </Card>
        ))}
      </div>
    </Loading>
  );
}

export function OrdersSkeleton() {
  return (
    <Loading>
      <Toolbar />
      <TableCard
        cells={[
          "stack",
          "stack",
          "text",
          "num",
          "num",
          "num",
          "pill",
          "actions",
        ]}
        rows={8}
      />
    </Loading>
  );
}

export function CatalogSkeleton() {
  return (
    <Loading>
      <Toolbar />
      <TableCard cells={["thumb", "num", "num", "num", "actions"]} rows={6} />
    </Loading>
  );
}

export function InventorySkeleton() {
  return (
    <Loading>
      <Toolbar button={false} />
      <TableCard
        cells={["thumb", "num", "num", "num", "num", "num", "actions"]}
        rows={6}
      />
    </Loading>
  );
}

export function CustomersSkeleton() {
  return (
    <Loading>
      <Toolbar pills={4} search button={false} />
      <TableCard
        cells={["text", "stack", "text", "text", "num", "num", "text"]}
        rows={8}
      />
    </Loading>
  );
}

export function ExpensesSkeleton() {
  return (
    <Loading>
      <Toolbar pills={5} />
      <Card index={1} className="bg-apricot/40 p-5 sm:max-w-xs">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="mt-5 h-8 w-40" />
      </Card>
      <TableCard
        cells={["text", "text", "stack", "num", "pill", "actions"]}
        rows={6}
        index={2}
      />
    </Loading>
  );
}

export function ReinvestmentsSkeleton() {
  return (
    <Loading>
      <Toolbar />
      <StatTiles count={4} index={1} accent />
      <TableCard
        cells={["text", "stack", "text", "num", "pill", "actions"]}
        rows={5}
        index={5}
      />
    </Loading>
  );
}

export function DetailSkeleton() {
  return (
    <Loading>
      <Skeleton className="h-4 w-36" />
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2.5 h-4 w-32" />
            </div>
          ))}
        </div>
      </Card>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} index={1 + i} className="p-5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-5 h-7 w-28" />
          </Card>
        ))}
      </div>
      <TableCard
        cells={["stack", "text", "num", "num", "num", "text", "pill"]}
        rows={4}
        index={4}
      />
    </Loading>
  );
}

/** The skeleton of the page at this path; used the instant a link is clicked. */
export function PageSkeleton({ pathname }: { pathname: string }) {
  if (pathname.startsWith("/dashboard")) return <DashboardSkeleton />;
  if (/^\/customers\/[^/]+/.test(pathname)) return <DetailSkeleton />;
  if (pathname.startsWith("/customers")) return <CustomersSkeleton />;
  if (pathname.startsWith("/orders")) return <OrdersSkeleton />;
  if (pathname.startsWith("/catalog")) return <CatalogSkeleton />;
  if (pathname.startsWith("/inventory")) return <InventorySkeleton />;
  if (pathname.startsWith("/expenses")) return <ExpensesSkeleton />;
  if (pathname.startsWith("/reinvestments")) return <ReinvestmentsSkeleton />;
  return <OrdersSkeleton />;
}
