export default function Loading() {
  return (
    <div role="status" aria-label="Բեռնվում է" className="flex flex-col gap-5">
      <div className="h-5 w-28 animate-pulse rounded-md bg-muted" />
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
